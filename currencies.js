// Currency routes - Public listing and admin update

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/currencies
 * Get all active currencies (public)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const currencies = db
      .prepare('SELECT * FROM currencies WHERE is_active = 1 ORDER BY is_default DESC, code ASC')
      .all();

    res.json({
      success: true,
      data: currencies,
    });
  } catch (error) {
    console.error('List currencies error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب العملات',
    });
  }
});

/**
 * PUT /api/admin/currencies/:id
 * Update a currency (auth required)
 */
router.put('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const existing = db.prepare('SELECT * FROM currencies WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'العملة غير موجودة',
      });
    }

    const { name, symbol, exchange_rate, is_active } = req.body;

    if (exchange_rate !== undefined && (isNaN(Number(exchange_rate)) || Number(exchange_rate) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'سعر الصرف يجب أن يكون رقماً غير سالب',
      });
    }

    db.prepare(
      `UPDATE currencies SET
        name = ?, symbol = ?, exchange_rate = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`
    ).run(
      name || existing.name,
      symbol || existing.symbol,
      exchange_rate !== undefined ? Number(exchange_rate) : existing.exchange_rate,
      is_active !== undefined ? (is_active ? 1 : 0) : existing.is_active,
      id
    );

    const updated = db.prepare('SELECT * FROM currencies WHERE id = ?').get(id);

    logActivity({
      userId: req.user.id,
      action: 'update_currency',
      entityType: 'currency',
      entityId: Number(id),
      details: { code: existing.code, exchange_rate: updated.exchange_rate },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث العملة بنجاح',
      data: updated,
    });
  } catch (error) {
    console.error('Update currency error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث العملة',
    });
  }
});

module.exports = router;
