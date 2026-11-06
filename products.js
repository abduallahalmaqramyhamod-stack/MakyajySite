// Product routes - CRUD operations, image management, public listing

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');
const { upload, processImage, deleteImage, handleUploadError } = require('../middleware/upload');
const { validateProductInput } = require('../middleware/validate');
const { generateSlug, ensureUniqueSlug, paginate, calculateDiscountPercentage } = require('../utils/helpers');

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/products
 * List products with pagination, filtering, and sorting (public)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 20,
      category,
      brand,
      search,
      min_price,
      max_price,
      featured,
      is_new,
      on_sale,
      sort = 'created_at',
      order = 'desc',
      category_slug,
      brand_slug,
    } = req.query;

    let where = ['p.is_active = 1'];
    let params = [];

    // Filter by category (id or slug)
    if (category) {
      where.push('p.category_id = ?');
      params.push(category);
    } else if (category_slug) {
      where.push('p.category_id = (SELECT id FROM categories WHERE slug = ?)');
      params.push(category_slug);
    }

    // Filter by brand (id or slug)
    if (brand) {
      where.push('p.brand_id = ?');
      params.push(brand);
    } else if (brand_slug) {
      where.push('p.brand_id = (SELECT id FROM brands WHERE slug = ?)');
      params.push(brand_slug);
    }

    // Search in name, short_description, tags
    if (search) {
      where.push('(p.name LIKE ? OR p.short_description LIKE ? OR p.tags LIKE ? OR p.sku LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Price range
    if (min_price) {
      where.push('p.price >= ?');
      params.push(Number(min_price));
    }
    if (max_price) {
      where.push('p.price <= ?');
      params.push(Number(max_price));
    }

    // Featured products
    if (featured === '1' || featured === 'true') {
      where.push('p.is_featured = 1');
    }

    // New products
    if (is_new === '1' || is_new === 'true') {
      where.push('p.is_new = 1');
    }

    // On sale (has compare_price higher than price)
    if (on_sale === '1' || on_sale === 'true') {
      where.push('p.compare_price IS NOT NULL AND p.compare_price > p.price');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Count total items
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM products p ${whereClause}`).get(...params);
    const pagination = paginate(page, limit, countRow.count);

    // Determine sort column
    const allowedSorts = {
      created_at: 'p.created_at',
      price: 'p.price',
      name: 'p.name',
      sales_count: 'p.sales_count',
      views: 'p.views',
    };
    const sortCol = allowedSorts[sort] || 'p.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Fetch products with primary image
    const products = db
      .prepare(
        `SELECT p.*,
          c.name as category_name,
          b.name as brand_name,
          (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
          (SELECT thumbnail_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_thumbnail
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        ${whereClause}
        ORDER BY ${sortCol} ${sortOrder}
        LIMIT ? OFFSET ?`
      )
      .all(...params, pagination.perPage, pagination.offset);

    // Add discount percentage to each product
    const enrichedProducts = products.map((product) => ({
      ...product,
      discount_percentage: calculateDiscountPercentage(product.compare_price, product.price),
    }));

    res.json({
      success: true,
      data: enrichedProducts,
      pagination: {
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب المنتجات',
    });
  }
});

/**
 * GET /api/products/:slug
 * Get a single product by slug with images, variants, and related products (public)
 */
router.get('/:slug', (req, res) => {
  try {
    const db = getDb();
    const { slug } = req.params;

    const product = db
      .prepare(
        `SELECT p.*,
          c.name as category_name, c.slug as category_slug,
          b.name as brand_name, b.slug as brand_slug
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.slug = ? AND p.is_active = 1`
      )
      .get(slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود',
      });
    }

    // Increment views count
    db.prepare('UPDATE products SET views = views + 1 WHERE id = ?').run(product.id);

    // Get product images
    const images = db
      .prepare('SELECT * FROM product_images WHERE product_id = ? ORDER BY is_primary DESC, sort_order ASC')
      .all(product.id);

    // Get product variants
    const variants = db
      .prepare('SELECT * FROM product_variants WHERE product_id = ? AND is_active = 1')
      .all(product.id);

    // Get related products (same category, excluding current product)
    const relatedProducts = db
      .prepare(
        `SELECT p.*,
          (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
          (SELECT thumbnail_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_thumbnail
        FROM products p
        WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
        ORDER BY p.sales_count DESC
        LIMIT 8`
      )
      .all(product.category_id, product.id);

    // Add discount percentage
    product.discount_percentage = calculateDiscountPercentage(product.compare_price, product.price);

    res.json({
      success: true,
      data: {
        ...product,
        images,
        variants,
        related_products: relatedProducts.map((rp) => ({
          ...rp,
          discount_percentage: calculateDiscountPercentage(rp.compare_price, rp.price),
        })),
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات المنتج',
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/admin/products
 * Create a new product (auth required)
 */
router.post('/admin', authenticate, validateProductInput, (req, res) => {
  try {
    const db = getDb();
    const {
      name,
      short_description,
      description,
      sku,
      price,
      compare_price,
      cost_price,
      currency = 'YER',
      category_id,
      brand_id,
      stock_quantity = 0,
      low_stock_threshold = 5,
      is_active = 1,
      is_featured = 0,
      is_new = 1,
      has_variants = 0,
      weight,
      tags,
      meta_title,
      meta_description,
      variants,
    } = req.body;

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const slug = ensureUniqueSlug(db, 'products', baseSlug);

    // Check SKU uniqueness if provided
    if (sku) {
      const existingSku = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'رقم المنتج (SKU) مستخدم بالفعل',
        });
      }
    }

    const result = db
      .prepare(
        `INSERT INTO products (name, slug, short_description, description, sku, price, compare_price, cost_price, currency, category_id, brand_id, stock_quantity, low_stock_threshold, is_active, is_featured, is_new, has_variants, weight, tags, meta_title, meta_description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        name.trim(),
        slug,
        short_description || null,
        description || null,
        sku || null,
        Number(price),
        compare_price ? Number(compare_price) : null,
        cost_price ? Number(cost_price) : null,
        currency,
        category_id || null,
        brand_id || null,
        Number(stock_quantity),
        Number(low_stock_threshold),
        is_active ? 1 : 0,
        is_featured ? 1 : 0,
        is_new ? 1 : 0,
        has_variants ? 1 : 0,
        weight ? Number(weight) : null,
        tags || null,
        meta_title || null,
        meta_description || null
      );

    const productId = result.lastInsertRowid;

    // Insert variants if provided
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const insertVariant = db.prepare(
        'INSERT INTO product_variants (product_id, name, value, price_adjustment, stock_quantity, sku) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (const variant of variants) {
        insertVariant.run(
          productId,
          variant.name,
          variant.value,
          variant.price_adjustment || 0,
          variant.stock_quantity || 0,
          variant.sku || null
        );
      }
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

    logActivity({
      userId: req.user.id,
      action: 'create_product',
      entityType: 'product',
      entityId: productId,
      details: { name: product.name, sku: product.sku },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة المنتج بنجاح',
      data: product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة المنتج',
    });
  }
});

/**
 * PUT /api/admin/products/:id
 * Update a product (auth required)
 */
router.put('/admin/:id', authenticate, validateProductInput, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود',
      });
    }

    const {
      name,
      short_description,
      description,
      sku,
      price,
      compare_price,
      cost_price,
      currency,
      category_id,
      brand_id,
      stock_quantity,
      low_stock_threshold,
      is_active,
      is_featured,
      is_new,
      has_variants,
      weight,
      tags,
      meta_title,
      meta_description,
      variants,
    } = req.body;

    // Regenerate slug if name changed
    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      const baseSlug = generateSlug(name);
      slug = ensureUniqueSlug(db, 'products', baseSlug, Number(id));
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existing.sku) {
      const existingSku = db.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(sku, id);
      if (existingSku) {
        return res.status(400).json({
          success: false,
          message: 'رقم المنتج (SKU) مستخدم بالفعل',
        });
      }
    }

    db.prepare(
      `UPDATE products SET
        name = ?, slug = ?, short_description = ?, description = ?, sku = ?,
        price = ?, compare_price = ?, cost_price = ?, currency = ?,
        category_id = ?, brand_id = ?, stock_quantity = ?, low_stock_threshold = ?,
        is_active = ?, is_featured = ?, is_new = ?, has_variants = ?,
        weight = ?, tags = ?, meta_title = ?, meta_description = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      name ? name.trim() : existing.name,
      slug,
      short_description !== undefined ? short_description : existing.short_description,
      description !== undefined ? description : existing.description,
      sku !== undefined ? (sku || null) : existing.sku,
      price !== undefined ? Number(price) : existing.price,
      compare_price !== undefined ? (compare_price ? Number(compare_price) : null) : existing.compare_price,
      cost_price !== undefined ? (cost_price ? Number(cost_price) : null) : existing.cost_price,
      currency || existing.currency,
      category_id !== undefined ? (category_id || null) : existing.category_id,
      brand_id !== undefined ? (brand_id || null) : existing.brand_id,
      stock_quantity !== undefined ? Number(stock_quantity) : existing.stock_quantity,
      low_stock_threshold !== undefined ? Number(low_stock_threshold) : existing.low_stock_threshold,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing.is_featured,
      is_new !== undefined ? (is_new ? 1 : 0) : existing.is_new,
      has_variants !== undefined ? (has_variants ? 1 : 0) : existing.has_variants,
      weight !== undefined ? (weight ? Number(weight) : null) : existing.weight,
      tags !== undefined ? tags : existing.tags,
      meta_title !== undefined ? meta_title : existing.meta_title,
      meta_description !== undefined ? meta_description : existing.meta_description,
      id
    );

    // Update variants if provided
    if (variants && Array.isArray(variants)) {
      // Remove old variants
      db.prepare('DELETE FROM product_variants WHERE product_id = ?').run(id);
      // Insert new ones
      const insertVariant = db.prepare(
        'INSERT INTO product_variants (product_id, name, value, price_adjustment, stock_quantity, sku, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)'
      );
      for (const variant of variants) {
        insertVariant.run(
          id,
          variant.name,
          variant.value,
          variant.price_adjustment || 0,
          variant.stock_quantity || 0,
          variant.sku || null,
          variant.is_active !== undefined ? (variant.is_active ? 1 : 0) : 1
        );
      }
    }

    const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

    logActivity({
      userId: req.user.id,
      action: 'update_product',
      entityType: 'product',
      entityId: Number(id),
      details: { name: updated.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث المنتج بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث المنتج',
    });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete a product (auth required)
 */
router.delete('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود',
      });
    }

    // Check if product has orders
    const orderCount = db.prepare('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?').get(id);
    if (orderCount.count > 0) {
      // Soft delete: just deactivate
      db.prepare('UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(id);

      logActivity({
        userId: req.user.id,
        action: 'deactivate_product',
        entityType: 'product',
        entityId: Number(id),
        details: { name: product.name, reason: 'has_orders' },
        ipAddress: req.ip,
      });

      return res.json({
        success: true,
        message: 'تم إخفاء المنتج لأنه مرتبط بطلبات سابقة',
      });
    }

    // Delete product images from disk
    const images = db.prepare('SELECT image_path, thumbnail_path FROM product_images WHERE product_id = ?').all(id);
    for (const img of images) {
      deleteImage(img.image_path);
    }

    // Delete product (cascades to images and variants)
    db.prepare('DELETE FROM products WHERE id = ?').run(id);

    logActivity({
      userId: req.user.id,
      action: 'delete_product',
      entityType: 'product',
      entityId: Number(id),
      details: { name: product.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم حذف المنتج بنجاح',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المنتج',
    });
  }
});

/**
 * PATCH /api/admin/products/:id/toggle
 * Toggle product active status (auth required)
 */
router.patch('/admin/:id/toggle', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const product = db.prepare('SELECT id, name, is_active FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود',
      });
    }

    const newStatus = product.is_active ? 0 : 1;
    db.prepare('UPDATE products SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);

    logActivity({
      userId: req.user.id,
      action: newStatus ? 'activate_product' : 'deactivate_product',
      entityType: 'product',
      entityId: Number(id),
      details: { name: product.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: newStatus ? 'تم تفعيل المنتج' : 'تم إخفاء المنتج',
      data: { is_active: newStatus },
    });
  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة المنتج',
    });
  }
});

/**
 * POST /api/admin/products/:id/images
 * Upload images for a product (auth required)
 */
router.post('/admin/:id/images', authenticate, upload.array('images', 10), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const product = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار صورة واحدة على الأقل',
      });
    }

    // Check if product already has a primary image
    const hasPrimary = db.prepare('SELECT id FROM product_images WHERE product_id = ? AND is_primary = 1').get(id);

    const insertedImages = [];
    const insertImage = db.prepare(
      'INSERT INTO product_images (product_id, image_path, thumbnail_path, alt_text, sort_order, is_primary) VALUES (?, ?, ?, ?, ?, ?)'
    );

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const { imagePath, thumbnailPath } = await processImage(file.buffer, 'products');

      const isPrimary = !hasPrimary && i === 0 ? 1 : 0;
      const sortOrder = i;

      const result = insertImage.run(id, imagePath, thumbnailPath, req.body.alt_text || null, sortOrder, isPrimary);

      insertedImages.push({
        id: result.lastInsertRowid,
        product_id: Number(id),
        image_path: imagePath,
        thumbnail_path: thumbnailPath,
        is_primary: isPrimary,
        sort_order: sortOrder,
      });
    }

    logActivity({
      userId: req.user.id,
      action: 'upload_product_images',
      entityType: 'product',
      entityId: Number(id),
      details: { count: req.files.length },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: `تم رفع ${req.files.length} صورة بنجاح`,
      data: insertedImages,
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الصور',
    });
  }
});

/**
 * DELETE /api/admin/products/:id/images/:imageId
 * Delete a product image (auth required)
 */
router.delete('/admin/:id/images/:imageId', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id, imageId } = req.params;

    const image = db
      .prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?')
      .get(imageId, id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'الصورة غير موجودة',
      });
    }

    // Delete file from disk
    deleteImage(image.image_path);

    // Delete from database
    db.prepare('DELETE FROM product_images WHERE id = ?').run(imageId);

    // If deleted image was primary, set the next one as primary
    if (image.is_primary) {
      const nextImage = db.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1').get(id);
      if (nextImage) {
        db.prepare('UPDATE product_images SET is_primary = 1 WHERE id = ?').run(nextImage.id);
      }
    }

    logActivity({
      userId: req.user.id,
      action: 'delete_product_image',
      entityType: 'product',
      entityId: Number(id),
      details: { imageId: Number(imageId) },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم حذف الصورة بنجاح',
    });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الصورة',
    });
  }
});

module.exports = router;
