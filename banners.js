// Banner routes - Public listing and admin CRUD

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');
const { upload, processImage, deleteImage, handleUploadError } = require('../middleware/upload');

const router = express.Router();

/**
 * GET /api/banners
 * Get active banners sorted by order (public)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const banners = db
      .prepare('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC, created_at DESC')
      .all();

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('List banners error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب البانرات',
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * POST /api/admin/banners
 * Create a new banner (auth required)
 */
router.post('/admin', authenticate, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { title, subtitle, link, sort_order = 0, is_active = 1 } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'صورة البانر مطلوبة',
      });
    }

    const { imagePath } = await processImage(req.file.buffer, 'banners', {
      width: 1200,
      height: 500,
      thumbnailWidth: 600,
      thumbnailHeight: 250,
    });

    const result = db
      .prepare(
        'INSERT INTO banners (title, subtitle, image, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(
        title || null,
        subtitle || null,
        imagePath,
        link || null,
        Number(sort_order),
        is_active ? 1 : 0
      );

    const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(result.lastInsertRowid);

    logActivity({
      userId: req.user.id,
      action: 'create_banner',
      entityType: 'banner',
      entityId: banner.id,
      details: { title: banner.title },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة البانر بنجاح',
      data: banner,
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إضافة البانر',
    });
  }
});

/**
 * PUT /api/admin/banners/:id
 * Update a banner (auth required)
 */
router.put('/admin/:id', authenticate, upload.single('image'), handleUploadError, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'البانر غير موجود',
      });
    }

    const { title, subtitle, link, sort_order, is_active } = req.body;

    let image = existing.image;
    if (req.file) {
      // Delete old image
      deleteImage(existing.image);
      const processed = await processImage(req.file.buffer, 'banners', {
        width: 1200,
        height: 500,
        thumbnailWidth: 600,
        thumbnailHeight: 250,
      });
      image = processed.imagePath;
    }

    db.prepare(
      `UPDATE banners SET
        title = ?, subtitle = ?, image = ?, link = ?,
        sort_order = ?, is_active = ?
      WHERE id = ?`
    ).run(
      title !== undefined ? title : existing.title,
      subtitle !== undefined ? subtitle : existing.subtitle,
      image,
      link !== undefined ? link : existing.link,
      sort_order !== undefined ? Number(sort_order) : existing.sort_order,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);

    logActivity({
      userId: req.user.id,
      action: 'update_banner',
      entityType: 'banner',
      entityId: Number(id),
      details: { title: updated.title },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث البانر بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث البانر',
    });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * Delete a banner (auth required)
 */
router.delete('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const banner = db.prepare('SELECT * FROM banners WHERE id = ?').get(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: 'البانر غير موجود',
      });
    }

    // Delete image from disk
    deleteImage(banner.image);

    db.prepare('DELETE FROM banners WHERE id = ?').run(id);

    logActivity({
      userId: req.user.id,
      action: 'delete_banner',
      entityType: 'banner',
      entityId: Number(id),
      details: { title: banner.title },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم حذف البانر بنجاح',
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف البانر',
    });
  }
});

module.exports = router;
