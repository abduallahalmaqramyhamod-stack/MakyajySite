// Category routes - CRUD operations, public listing

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');
const { upload, processImage, deleteImage, handleUploadError } = require('../middleware/upload');
const { generateSlug, ensureUniqueSlug, paginate } = require('../utils/helpers');

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/categories
 * List all active categories (public)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { include_count } = req.query;

    let query;
    if (include_count === '1' || include_count === 'true') {
      query = `
        SELECT c.*,
          (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_active = 1) as product_count
        FROM categories c
        WHERE c.is_active = 1
        ORDER BY c.sort_order ASC, c.name ASC
      `;
    } else {
      query = `
        SELECT * FROM categories
        WHERE is_active = 1
        ORDER BY sort_order ASC, name ASC
      `;
    }

    const categories = db.prepare(query).all();

    // Build tree structure for parent-child relationships
    const rootCategories = categories.filter((c) => !c.parent_id);
    const tree = rootCategories.map((parent) => ({
      ...parent,
      children: categories.filter((c) => c.parent_id === parent.id),
    }));

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب التصنيفات',
    });
  }
});

/**
 * GET /api/categories/:slug
 * Get a category by slug with its products (public)
 */
router.get('/:slug', (req, res) => {
  try {
    const db = getDb();
    const { slug } = req.params;
    const { page = 1, limit = 20, sort = 'created_at', order = 'desc' } = req.query;

    const category = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(slug);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود',
      });
    }

    // Get subcategories
    const subcategories = db
      .prepare('SELECT * FROM categories WHERE parent_id = ? AND is_active = 1 ORDER BY sort_order ASC')
      .all(category.id);

    // Get category IDs (include subcategories)
    const categoryIds = [category.id, ...subcategories.map((s) => s.id)];
    const placeholders = categoryIds.map(() => '?').join(',');

    // Count products in this category and subcategories
    const countRow = db
      .prepare(`SELECT COUNT(*) as count FROM products WHERE category_id IN (${placeholders}) AND is_active = 1`)
      .get(...categoryIds);

    const pagination = paginate(page, limit, countRow.count);

    const allowedSorts = {
      created_at: 'p.created_at',
      price: 'p.price',
      name: 'p.name',
      sales_count: 'p.sales_count',
    };
    const sortCol = allowedSorts[sort] || 'p.created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const products = db
      .prepare(
        `SELECT p.*,
          (SELECT image_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_image,
          (SELECT thumbnail_path FROM product_images WHERE product_id = p.id AND is_primary = 1 LIMIT 1) as primary_thumbnail
        FROM products p
        WHERE p.category_id IN (${placeholders}) AND p.is_active = 1
        ORDER BY ${sortCol} ${sortOrder}
        LIMIT ? OFFSET ?`
      )
      .all(...categoryIds, pagination.perPage, pagination.offset);

    res.json({
      success: true,
      data: {
        category,
        subcategories,
        products,
        pagination: {
          currentPage: pagination.currentPage,
          perPage: pagination.perPage,
          totalItems: pagination.totalItems,
          totalPages: pagination.totalPages,
          hasNextPage: pagination.hasNextPage,
          hasPrevPage: pagination.hasPrevPage,
        },
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات التصنيف',
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/admin/categories
 * Create a new category (auth required)
 */
router.post('/admin', authenticate, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { name, name_en, description, parent_id, sort_order = 0, is_active = 1 } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم التصنيف مطلوب',
      });
    }

    const baseSlug = generateSlug(name);
    const slug = ensureUniqueSlug(db, 'categories', baseSlug);

    let image = null;
    if (req.file) {
      const processed = await processImage(req.file.buffer, 'categories', {
        width: 400,
        height: 400,
      });
      image = processed.imagePath;
    }

    const result = db
      .prepare(
        'INSERT INTO categories (name, name_en, slug, description, image, parent_id, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        name.trim(),
        name_en || null,
        slug,
        description || null,
        image,
        parent_id || null,
        Number(sort_order),
        is_active ? 1 : 0
      );

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);

    logActivity({
      userId: req.user.id,
      action: 'create_category',
      entityType: 'category',
      entityId: category.id,
      details: { name: category.name },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة التصنيف بنجاح',
      data: category,
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة التصنيف',
    });
  }
});

/**
 * PUT /api/admin/categories/:id
 * Update a category (auth required)
 */
router.put('/admin/:id', authenticate, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود',
      });
    }

    const { name, name_en, description, parent_id, sort_order, is_active } = req.body;

    // Prevent setting parent to self
    if (parent_id && Number(parent_id) === Number(id)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تعيين التصنيف كأب لنفسه',
      });
    }

    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      const baseSlug = generateSlug(name);
      slug = ensureUniqueSlug(db, 'categories', baseSlug, Number(id));
    }

    let image = existing.image;
    if (req.file) {
      // Delete old image
      if (existing.image) {
        deleteImage(existing.image);
      }
      const processed = await processImage(req.file.buffer, 'categories', {
        width: 400,
        height: 400,
      });
      image = processed.imagePath;
    }

    db.prepare(
      `UPDATE categories SET
        name = ?, name_en = ?, slug = ?, description = ?, image = ?,
        parent_id = ?, sort_order = ?, is_active = ?
      WHERE id = ?`
    ).run(
      name ? name.trim() : existing.name,
      name_en !== undefined ? name_en : existing.name_en,
      slug,
      description !== undefined ? description : existing.description,
      image,
      parent_id !== undefined ? (parent_id || null) : existing.parent_id,
      sort_order !== undefined ? Number(sort_order) : existing.sort_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);

    logActivity({
      userId: req.user.id,
      action: 'update_category',
      entityType: 'category',
      entityId: Number(id),
      details: { name: updated.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث التصنيف بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث التصنيف',
    });
  }
});

/**
 * DELETE /api/admin/categories/:id
 * Delete a category (auth required)
 */
router.delete('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود',
      });
    }

    // Check if category has products
    const productCount = db
      .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
      .get(id);
    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف التصنيف لأنه يحتوي على ${productCount.count} منتج`,
      });
    }

    // Check if category has subcategories
    const subCount = db
      .prepare('SELECT COUNT(*) as count FROM categories WHERE parent_id = ?')
      .get(id);
    if (subCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف التصنيف لأنه يحتوي على تصنيفات فرعية',
      });
    }

    // Delete image from disk
    if (category.image) {
      deleteImage(category.image);
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);

    logActivity({
      userId: req.user.id,
      action: 'delete_category',
      entityType: 'category',
      entityId: Number(id),
      details: { name: category.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم حذف التصنيف بنجاح',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف التصنيف',
    });
  }
});

module.exports = router;
