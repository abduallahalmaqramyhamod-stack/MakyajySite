// Database initialization module
// Creates all tables and inserts default/seed data

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;

/**
 * Get or create the database instance
 * @returns {Database} better-sqlite3 database instance
 */
function getDb() {
  if (db) return db;

  const dbPath = path.resolve(process.env.DB_PATH || './data/makeupi.db');
  const dbDir = path.dirname(dbPath);

  // Ensure the data directory exists
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  return db;
}

/**
 * Initialize all database tables
 */
function initializeTables() {
  const db = getDb();

  db.exec(`
    -- Users (admin users)
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'admin',
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      image TEXT,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Brands
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_en TEXT,
      slug TEXT UNIQUE NOT NULL,
      logo TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      short_description TEXT,
      description TEXT,
      sku TEXT UNIQUE,
      price REAL NOT NULL,
      compare_price REAL,
      cost_price REAL,
      currency TEXT DEFAULT 'YER',
      category_id INTEGER,
      brand_id INTEGER,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 5,
      is_active INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 1,
      has_variants INTEGER DEFAULT 0,
      weight REAL,
      tags TEXT,
      meta_title TEXT,
      meta_description TEXT,
      views INTEGER DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    );

    -- Product Images
    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      image_path TEXT NOT NULL,
      thumbnail_path TEXT,
      alt_text TEXT,
      sort_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Product Variants (color, size)
    CREATE TABLE IF NOT EXISTS product_variants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      price_adjustment REAL DEFAULT 0,
      stock_quantity INTEGER DEFAULT 0,
      sku TEXT,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- Orders
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT,
      governorate TEXT NOT NULL,
      area TEXT NOT NULL,
      address_detail TEXT NOT NULL,
      notes TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      shipping_fee REAL DEFAULT 0,
      total REAL NOT NULL,
      currency TEXT DEFAULT 'YER',
      exchange_rate REAL DEFAULT 1,
      payment_method TEXT DEFAULT 'cash_on_delivery',
      payment_status TEXT DEFAULT 'pending',
      order_status TEXT DEFAULT 'new',
      status_history TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_sku TEXT,
      variant_info TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Customers (extracted from orders)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      email TEXT,
      governorate TEXT,
      area TEXT,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Store Settings
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      group_name TEXT DEFAULT 'general',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Currencies
    CREATE TABLE IF NOT EXISTS currencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      exchange_rate REAL NOT NULL DEFAULT 1,
      is_default INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Banners
    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      image TEXT NOT NULL,
      link TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Shipping Fees
    CREATE TABLE IF NOT EXISTS shipping_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      governorate TEXT NOT NULL,
      fee REAL NOT NULL DEFAULT 0,
      estimated_days TEXT,
      is_active INTEGER DEFAULT 1
    );

    -- Activity Log
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
    CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
    CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
    CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
    CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);
    CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
    CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
    CREATE INDEX IF NOT EXISTS idx_brands_slug ON brands(slug);
    CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
  `);
}

/**
 * Insert default/seed data into the database
 */
function seedDefaultData() {
  const db = getDb();

  // -- Default Currencies --
  const currencyCount = db.prepare('SELECT COUNT(*) as count FROM currencies').get();
  if (currencyCount.count === 0) {
    const insertCurrency = db.prepare(
      'INSERT INTO currencies (code, name, symbol, exchange_rate, is_default, is_active) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertCurrency.run('YER', 'ريال يمني', 'ر.ي', 1, 1, 1);
    insertCurrency.run('USD', 'دولار أمريكي', '$', 0, 0, 1);
  }

  // -- Default Settings --
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM settings').get();
  if (settingsCount.count === 0) {
    const insertSetting = db.prepare(
      'INSERT INTO settings (key, value, group_name) VALUES (?, ?, ?)'
    );

    // General settings
    insertSetting.run('store_name', 'مكياجي – منبع الجمال', 'general');
    insertSetting.run('store_name_en', 'Makeupi - Beauty Source', 'general');
    insertSetting.run('store_description', 'متجر متخصص في مستحضرات التجميل والعناية بالبشرة والشعر', 'general');
    insertSetting.run('store_phone', '+967 123 456 789', 'contact');
    insertSetting.run('store_whatsapp', '+967 123 456 789', 'contact');
    insertSetting.run('store_email', 'info@makeupi.store', 'contact');
    insertSetting.run('store_address', 'اليمن – محافظة تعز – التربة – المركز التجاري الأمين – مقابل فلورينا للأحذية والشنط', 'contact');
    insertSetting.run('store_logo', '', 'general');
    insertSetting.run('store_favicon', '', 'general');
    insertSetting.run('social_facebook', '', 'social');
    insertSetting.run('social_instagram', '', 'social');
    insertSetting.run('social_twitter', '', 'social');
    insertSetting.run('social_tiktok', '', 'social');
    insertSetting.run('social_snapchat', '', 'social');
    insertSetting.run('min_order_amount', '0', 'orders');
    insertSetting.run('free_shipping_threshold', '0', 'orders');
    insertSetting.run('default_currency', 'YER', 'general');
    insertSetting.run('tax_enabled', 'false', 'orders');
    insertSetting.run('tax_rate', '0', 'orders');
    insertSetting.run('maintenance_mode', 'false', 'general');
  }

  // -- Default Shipping Fees --
  const shippingCount = db.prepare('SELECT COUNT(*) as count FROM shipping_fees').get();
  if (shippingCount.count === 0) {
    const insertShipping = db.prepare(
      'INSERT INTO shipping_fees (governorate, fee, estimated_days, is_active) VALUES (?, ?, ?, 1)'
    );

    const governorates = [
      { name: 'تعز', fee: 500, days: '1-2 يوم' },
      { name: 'صنعاء', fee: 1500, days: '2-4 أيام' },
      { name: 'عدن', fee: 1000, days: '2-3 أيام' },
      { name: 'إب', fee: 800, days: '1-2 يوم' },
      { name: 'الحديدة', fee: 1200, days: '2-3 أيام' },
      { name: 'ذمار', fee: 1000, days: '2-3 أيام' },
      { name: 'حضرموت', fee: 2000, days: '3-5 أيام' },
      { name: 'المكلا', fee: 2000, days: '3-5 أيام' },
      { name: 'لحج', fee: 1000, days: '2-3 أيام' },
      { name: 'أبين', fee: 1200, days: '2-4 أيام' },
      { name: 'شبوة', fee: 1500, days: '3-4 أيام' },
      { name: 'مأرب', fee: 1500, days: '3-4 أيام' },
      { name: 'البيضاء', fee: 1200, days: '2-4 أيام' },
      { name: 'الجوف', fee: 2000, days: '3-5 أيام' },
      { name: 'عمران', fee: 1500, days: '2-4 أيام' },
      { name: 'صعدة', fee: 2000, days: '3-5 أيام' },
      { name: 'حجة', fee: 1500, days: '2-4 أيام' },
      { name: 'المحويت', fee: 1500, days: '2-4 أيام' },
      { name: 'ريمة', fee: 1200, days: '2-3 أيام' },
      { name: 'الضالع', fee: 1000, days: '2-3 أيام' },
      { name: 'المهرة', fee: 2500, days: '4-6 أيام' },
      { name: 'سقطرى', fee: 3000, days: '5-7 أيام' },
    ];

    for (const gov of governorates) {
      insertShipping.run(gov.name, gov.fee, gov.days);
    }
  }

  // -- Default Categories --
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (categoryCount.count === 0) {
    const insertCategory = db.prepare(
      'INSERT INTO categories (name, name_en, slug, description, sort_order, is_active) VALUES (?, ?, ?, ?, ?, 1)'
    );

    const categories = [
      { name: 'مكياج الوجه', name_en: 'Face Makeup', slug: 'مكياج-الوجه', desc: 'كريم أساس، بودرة، كونسيلر، بلاشر، هايلايتر، كونتور', order: 1 },
      { name: 'مكياج العيون', name_en: 'Eye Makeup', slug: 'مكياج-العيون', desc: 'ظلال عيون، آيلاينر، ماسكارا، رموش صناعية', order: 2 },
      { name: 'مكياج الشفاه', name_en: 'Lip Makeup', slug: 'مكياج-الشفاه', desc: 'أحمر شفاه، ملمع شفاه، قلم تحديد الشفاه', order: 3 },
      { name: 'العناية بالبشرة', name_en: 'Skincare', slug: 'العناية-بالبشرة', desc: 'غسول، مرطب، سيروم، واقي شمس، أقنعة', order: 4 },
      { name: 'العناية بالشعر', name_en: 'Haircare', slug: 'العناية-بالشعر', desc: 'شامبو، بلسم، زيوت، كريم تصفيف، صبغات', order: 5 },
      { name: 'العطور', name_en: 'Perfumes', slug: 'العطور', desc: 'عطور نسائية، عطور رجالية، مجموعات هدايا', order: 6 },
      { name: 'إكسسوارات', name_en: 'Accessories', slug: 'إكسسوارات', desc: 'فرش مكياج، إسفنجات، مرايا، حقائب مكياج', order: 7 },
    ];

    for (const cat of categories) {
      insertCategory.run(cat.name, cat.name_en, cat.slug, cat.desc, cat.order);
    }
  }

  // -- Default Brands --
  const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get();
  if (brandCount.count === 0) {
    const insertBrand = db.prepare(
      'INSERT INTO brands (name, name_en, slug, description, is_active) VALUES (?, ?, ?, ?, 1)'
    );

    const brands = [
      { name: 'لوريال', name_en: "L'Oréal", slug: 'لوريال', desc: 'علامة تجارية فرنسية رائدة في مستحضرات التجميل' },
      { name: 'ماك', name_en: 'MAC', slug: 'ماك', desc: 'علامة تجارية عالمية متخصصة في المكياج الاحترافي' },
      { name: 'مايبيلين', name_en: 'Maybelline', slug: 'مايبيلين', desc: 'علامة تجارية أمريكية شهيرة لمستحضرات التجميل' },
      { name: 'نيفيا', name_en: 'Nivea', slug: 'نيفيا', desc: 'علامة تجارية ألمانية متخصصة في العناية بالبشرة' },
      { name: 'إيف سان لوران', name_en: 'Yves Saint Laurent', slug: 'إيف-سان-لوران', desc: 'علامة فاخرة فرنسية للمكياج والعطور' },
    ];

    for (const brand of brands) {
      insertBrand.run(brand.name, brand.name_en, brand.slug, brand.desc);
    }
  }
}

/**
 * Initialize the database: create tables and seed data
 */
function initializeDatabase() {
  initializeTables();
  seedDefaultData();
  console.log('✅ Database initialized successfully');
}

module.exports = {
  getDb,
  initializeDatabase,
};
