// Brand routes - CRUD operations, public listing

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');
const { upload, processImage, deleteImage, handleUploadError } = require('../middleware/upload');
const { generateSlug, ensureUniqueSlug } = require('../utils/helpers');

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * GET /api/brands
 * List all active brands (public)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { include_count } = req.query;

    let query;
    if (include_count === '1' || include_count === 'true') {
      query = `
        SELECT b.*,
          (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id AND p.is_active = 1) as product_count
        FROM brands b
        WHERE b.is_active = 1
        ORDER BY b.name ASC
      `;
    } else {
      query = 'SELECT * FROM brands WHERE is_active = 1 ORDER BY name ASC';
    }

    const brands = db.prepare(query).all();

    res.json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error('List brands error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب العلامات التجارية',
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/admin/brands
 * Create a new brand (auth required)
 */
router.post('/admin', authenticate, upload.single('logo'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { name, name_en, description, is_active = 1 } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'اسم العلامة التجارية مطلوب',
      });
    }

    const baseSlug = generateSlug(name);
    const slug = ensureUniqueSlug(db, 'brands', baseSlug);

    let logo = null;
    if (req.file) {
      const processed = await processImage(req.file.buffer, 'brands', {
        width: 300,
        height: 300,
      });
      logo = processed.imagePath;
    }

    const result = db
      .prepare(
        'INSERT INTO brands (name, name_en, slug, logo, description, is_active) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(name.trim(), name_en || null, slug, logo, description || null, is_active ? 1 : 0);

    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);

    logActivity({
      userId: req.user.id,
      action: 'create_brand',
      entityType: 'brand',
      entityId: brand.id,
      details: { name: brand.name },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة العلامة التجارية بنجاح',
      data: brand,
    });
  } catch (error) {
    console.error('Create brand error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة العلامة التجارية',
    });
  }
});

/**
 * PUT /api/admin/brands/:id
 * Update a brand (auth required)
 */
router.put('/admin/:id', authenticate, upload.single('logo'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'العلامة التجارية غير موجودة',
      });
    }

    const { name, name_en, description, is_active } = req.body;

    let slug = existing.slug;
    if (name && name.trim() !== existing.name) {
      const baseSlug = generateSlug(name);
      slug = ensureUniqueSlug(db, 'brands', baseSlug, Number(id));
    }

    let logo = existing.logo;
    if (req.file) {
      if (existing.logo) {
        deleteImage(existing.logo);
      }
      const processed = await processImage(req.file.buffer, 'brands', {
        width: 300,
        height: 300,
      });
      logo = processed.imagePath;
    }

    db.prepare(
      `UPDATE brands SET
        name = ?, name_en = ?, slug = ?, logo = ?, description = ?, is_active = ?
      WHERE id = ?`
    ).run(
      name ? name.trim() : existing.name,
      name_en !== undefined ? name_en : existing.name_en,
      slug,
      logo,
      description !== undefined ? description : existing.description,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);

    logActivity({
      userId: req.user.id,
      action: 'update_brand',
      entityType: 'brand',
      entityId: Number(id),
      details: { name: updated.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث العلامة التجارية بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('Update brand error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث العلامة التجارية',
    });
  }
});

/**
 * DELETE /api/admin/brands/:id
 * Delete a brand (auth required)
 */
router.delete('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'العلامة التجارية غير موجودة',
      });
    }

    // Check if brand has products
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE brand_id = ?').get(id);
    if (productCount.count > 0) {
      return res.status(400).json({
        success: false,
        message: `لا يمكن حذف العلامة التجارية لأنها مرتبطة بـ ${productCount.count} منتج`,
      });
    }

    // Delete logo from disk
    if (brand.logo) {
      deleteImage(brand.logo);
    }

    db.prepare('DELETE FROM brands WHERE id = ?').run(id);

    logActivity({
      userId: req.user.id,
      action: 'delete_brand',
      entityType: 'brand',
      entityId: Number(id),
      details: { name: brand.name },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم حذف العلامة التجارية بنجاح',
    });
  } catch (error) {
    console.error('Delete brand error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف العلامة التجارية',
    });
  }
});

module.exports = router;
