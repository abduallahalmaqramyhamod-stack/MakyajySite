const express = require('express');
const { getDb } = require('../database/init');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/admin/dashboard
 * Dashboard stats, recent orders, sales summary, low stock products
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();

    // 1. Total sales and total orders
    const salesStats = db.prepare(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN total ELSE 0 END), 0) as total_sales,
        COUNT(CASE WHEN order_status = 'new' THEN 1 END) as new_orders_count,
        COUNT(CASE WHEN order_status = 'processing' THEN 1 END) as processing_orders_count,
        COUNT(CASE WHEN order_status = 'delivered' THEN 1 END) as completed_orders_count
      FROM orders
    `).get();

    // 2. Total customers
    const customerStats = db.prepare(`
      SELECT COUNT(*) as total_customers FROM customers
    `).get();

    // 3. Total active products and out of stock
    const productStats = db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 END) as low_stock_count,
        COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_count
      FROM products
      WHERE is_active = 1
    `).get();

    // 4. Low stock products list (up to 10)
    const lowStockProducts = db.prepare(`
      SELECT id, name, slug, price, stock_quantity, low_stock_threshold
      FROM products
      WHERE is_active = 1 AND stock_quantity <= low_stock_threshold
      ORDER BY stock_quantity ASC
      LIMIT 10
    `).all();

    // 5. Recent orders (latest 10)
    const recentOrders = db.prepare(`
      SELECT id, order_number, customer_name, customer_phone, total, currency, order_status, payment_status, created_at
      FROM orders
      ORDER BY id DESC
      LIMIT 10
    `).all();

    // 6. Sales by status
    const ordersByStatus = db.prepare(`
      SELECT order_status, COUNT(*) as count, COALESCE(SUM(total), 0) as total_amount
      FROM orders
      GROUP BY order_status
    `).all();

    // 7. Recent 7 days sales
    const salesLast7Days = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d', created_at) as date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total), 0) as total_sales
      FROM orders
      WHERE created_at >= datetime('now', '-7 days') AND order_status != 'cancelled'
      GROUP BY strftime('%Y-%m-%d', created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      success: true,
      data: {
        stats: {
          total_sales: salesStats.total_sales,
          total_orders: salesStats.total_orders,
          new_orders: salesStats.new_orders_count,
          processing_orders: salesStats.processing_orders_count,
          completed_orders: salesStats.completed_orders_count,
          total_customers: customerStats.total_customers,
          total_products: productStats.total_products,
          low_stock_count: productStats.low_stock_count,
          out_of_stock_count: productStats.out_of_stock_count,
        },
        low_stock_products: lowStockProducts,
        recent_orders: recentOrders,
        orders_by_status: ordersByStatus,
        sales_chart: salesLast7Days,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات لوحة التحكم',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

module.exports = router;
