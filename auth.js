// Authentication routes - Login, logout, profile, password change

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');

const router = express.Router();

// Token expiry: 7 days
const TOKEN_EXPIRY = '7d';

/**
 * POST /api/auth/login
 * Login with username and password, returns JWT token
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'اسم المستخدم وكلمة المرور مطلوبان',
      });
    }

    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'الحساب معطل. يرجى التواصل مع المسؤول',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'اسم المستخدم أو كلمة المرور غير صحيحة',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    // Log activity
    logActivity({
      userId: user.id,
      action: 'login',
      entityType: 'user',
      entityId: user.id,
      details: 'تسجيل دخول ناجح',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الدخول',
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout - clears session on client side; logs the activity
 */
router.post('/logout', authenticate, (req, res) => {
  try {
    logActivity({
      userId: req.user.id,
      action: 'logout',
      entityType: 'user',
      entityId: req.user.id,
      details: 'تسجيل خروج',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تسجيل الخروج',
    });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user profile
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDb();
    const user = db
      .prepare('SELECT id, username, full_name, role, is_active, created_at, updated_at FROM users WHERE id = ?')
      .get(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات المستخدم',
    });
  }
});

/**
 * PUT /api/auth/change-password
 * Change the current user's password
 */
router.put('/change-password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية والجديدة مطلوبتان',
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل',
      });
    }

    const db = getDb();
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);

    const isMatch = bcrypt.compareSync(current_password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة',
      });
    }

    const hashedPassword = bcrypt.hashSync(new_password, 10);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      hashedPassword,
      req.user.id
    );

    logActivity({
      userId: req.user.id,
      action: 'change_password',
      entityType: 'user',
      entityId: req.user.id,
      details: 'تم تغيير كلمة المرور',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تغيير كلمة المرور',
    });
  }
});

module.exports = router;
