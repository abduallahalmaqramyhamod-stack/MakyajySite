const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');

const router = express.Router();

// GET /api/shipping - Public list of active shipping fees
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const fees = db.prepare('SELECT * FROM shipping_fees WHERE is_active = 1 ORDER BY governorate ASC').all();
    res.json({
      success: true,
      data: fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب رسوم التوصيل',
      error: error.message,
    });
  }
});

// GET /api/shipping/admin/all - Admin list including inactive
router.get('/admin/all', authenticate, (req, res) => {
  try {
    const db = getDb();
    const fees = db.prepare('SELECT * FROM shipping_fees ORDER BY governorate ASC').all();
    res.json({
      success: true,
      data: fees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات رسوم التوصيل',
      error: error.message,
    });
  }
});

// POST /api/shipping - Add governorate shipping fee (Admin)
router.post('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { governorate, fee, estimated_days, is_active = 1 } = req.body;

    if (!governorate || fee === undefined) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد المحافظة ورسوم التوصيل',
      });
    }

    const info = db.prepare(`
      INSERT INTO shipping_fees (governorate, fee, estimated_days, is_active)
      VALUES (?, ?, ?, ?)
    `).run(governorate, Number(fee), estimated_days || null, is_active ? 1 : 0);

    logActivity({
      userId: req.user.id,
      action: 'create_shipping_fee',
      entityType: 'shipping_fee',
      entityId: info.lastInsertRowid,
      details: { governorate, fee },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'تم إضافة رسوم التوصيل بنجاح',
      data: { id: info.lastInsertRowid, governorate, fee, estimated_days, is_active },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة رسوم التوصيل',
      error: error.message,
    });
  }
});

// PUT /api/shipping/:id - Update shipping fee (Admin)
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { fee, estimated_days, is_active } = req.body;

    const current = db.prepare('SELECT * FROM shipping_fees WHERE id = ?').get(id);
    if (!current) {
      return res.status(404).json({
        success: false,
        message: 'السجل غير موجود',
      });
    }

    db.prepare(`
      UPDATE shipping_fees
      SET fee = COALESCE(?, fee),
          estimated_days = COALESCE(?, estimated_days),
          is_active = COALESCE(?, is_active)
      WHERE id = ?
    `).run(
      fee !== undefined ? Number(fee) : current.fee,
      estimated_days !== undefined ? estimated_days : current.estimated_days,
      is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
      id
    );

    logActivity({
      userId: req.user.id,
      action: 'update_shipping_fee',
      entityType: 'shipping_fee',
      entityId: id,
      details: { fee, estimated_days, is_active },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث رسوم التوصيل بنجاح',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث رسوم التوصيل',
      error: error.message,
    });
  }
});

module.exports = router;
