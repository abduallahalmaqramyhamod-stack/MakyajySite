require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const bcrypt = require('bcryptjs');

const { initializeDatabase, getDb } = require('./database/init');
const { seedDemoProducts } = require('./database/seed_products');
const { UPLOAD_DIR } = require('./middleware/upload');

// Route modules
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const orderRoutes = require('./routes/orders');
const customerRoutes = require('./routes/customers');
const settingRoutes = require('./routes/settings');
const currencyRoutes = require('./routes/currencies');
const bannerRoutes = require('./routes/banners');
const dashboardRoutes = require('./routes/dashboard');
const shippingRoutes = require('./routes/shipping');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database & seed defaults
initializeDatabase();
seedDemoProducts();

// Ensure default admin user exists
function ensureDefaultAdmin() {
  const db = getDb();
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin');
  if (adminCount.count === 0) {
    const defaultUsername = process.env.ADMIN_DEFAULT_USER || 'admin';
    const defaultPassword = process.env.ADMIN_DEFAULT_PASS || 'admin123456';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

    db.prepare(`
      INSERT INTO users (username, password, full_name, role, is_active)
      VALUES (?, ?, ?, 'admin', 1)
    `).run(defaultUsername, hashedPassword, 'مدير المتجر');

    console.log('----------------------------------------------------');
    console.log('👑 Admin user created:');
    console.log(`   Username: ${defaultUsername}`);
    console.log(`   Password: ${defaultPassword}`);
    console.log('   (Please change password from settings upon login)');
    console.log('----------------------------------------------------');
  }
}
ensureDefaultAdmin();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all in dev/production with caution
      }
    },
    credentials: true,
  })
);

// Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
app.use('/uploads', express.static(UPLOAD_DIR));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
  },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'محاولات دخول كثيرة جداً. يرجى الانتظار 15 دقيقة.',
  },
});
app.use('/api/auth/login', authLimiter);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'مكياجي – منبع الجمال',
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار المطلوب غير موجود',
  });
});

// Serve frontend in production (or if client/dist exists)
const clientDistPath = path.resolve(__dirname, '../../client/dist');
const fs = require('fs');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ غير متوقع في الخادم',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🌸 خادم متجر مكياجي – منبع الجمال يعمل الآن على المنفذ: ${PORT}`);
  console.log(`📍 الرابط المحلي: http://localhost:${PORT}`);
});
