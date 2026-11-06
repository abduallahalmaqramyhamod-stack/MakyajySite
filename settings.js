// Settings routes - Public and admin settings management

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');

const router = express.Router();

// Public settings keys (safe to expose to frontend)
const PUBLIC_SETTINGS = [
  'store_name',
  'store_name_en',
  'store_description',
  'store_phone',
  'store_whatsapp',
  'store_email',
  'store_address',
  'store_logo',
  'store_favicon',
  'social_facebook',
  'social_instagram',
  'social_twitter',
  'social_tiktok',
  'social_snapchat',
  'default_currency',
  'min_order_amount',
  'free_shipping_threshold',
  'maintenance_mode',
];

/**
 * GET /api/settings
 * Get public settings (no auth required)
 */
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const placeholders = PUBLIC_SETTINGS.map(() => '?').join(',');
    const settings = db
      .prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`)
      .all(...PUBLIC_SETTINGS);

    // Convert to key-value object
    const settingsObj = {};
    for (const s of settings) {
      settingsObj[s.key] = s.value;
    }

    res.json({
      success: true,
      data: settingsObj,
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب إعدادات المتجر',
    });
  }
});

/**
 * GET /api/admin/settings
 * Get all settings grouped by category (auth required)
 */
router.get('/admin', authenticate, (req, res) => {
  try {
    const db = getDb();
    const settings = db.prepare('SELECT * FROM settings ORDER BY group_name, key').all();

    // Group by group_name
    const grouped = {};
    for (const s of settings) {
      if (!grouped[s.group_name]) {
        grouped[s.group_name] = [];
      }
      grouped[s.group_name].push(s);
    }

    res.json({
      success: true,
      data: {
        all: settings,
        grouped,
      },
    });
  } catch (error) {
    console.error('Get admin settings error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الإعدادات',
    });
  }
});

/**
 * PUT /api/admin/settings
 * Update settings (auth required)
 * Expects body: { settings: { key1: value1, key2: value2, ... } }
 */
router.put('/admin', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'بيانات الإعدادات غير صالحة',
      });
    }

    const upsert = db.prepare(
      `INSERT INTO settings (key, value, group_name, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
    );

    const updateMany = db.transaction((entries) => {
      for (const [key, value] of entries) {
        // Determine group from key prefix
        let group = 'general';
        if (key.startsWith('social_')) group = 'social';
        else if (key.startsWith('store_phone') || key.startsWith('store_whatsapp') || key.startsWith('store_email') || key.startsWith('store_address'))
          group = 'contact';
        else if (['min_order_amount', 'free_shipping_threshold', 'tax_enabled', 'tax_rate'].includes(key))
          group = 'orders';

        upsert.run(key, String(value), group);
      }
    });

    updateMany(Object.entries(settings));

    logActivity({
      userId: req.user.id,
      action: 'update_settings',
      entityType: 'settings',
      entityId: null,
      details: { keys: Object.keys(settings) },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الإعدادات',
    });
  }
});

module.exports = router;
