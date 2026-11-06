// Customer routes - Admin listing and details

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate } = require('../middleware/auth');
const { paginate } = require('../utils/helpers');

const router = express.Router();

/**
 * GET /api/admin/customers
 * List all customers with pagination and search (auth required)
 */
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, search, sort = 'created_at', order = 'desc' } = req.query;

    let where = [];
    let params = [];

    if (search) {
      where.push('(name LIKE ? OR phone LIKE ? OR email LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM customers ${whereClause}`).get(...params);
    const pagination = paginate(page, limit, countRow.count);

    const allowedSorts = {
      created_at: 'created_at',
      name: 'name',
      total_orders: 'total_orders',
      total_spent: 'total_spent',
    };
    const sortCol = allowedSorts[sort] || 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const customers = db
      .prepare(
        `SELECT * FROM customers ${whereClause}
         ORDER BY ${sortCol} ${sortOrder}
         LIMIT ? OFFSET ?`
      )
      .all(...params, pagination.perPage, pagination.offset);

    res.json({
      success: true,
      data: customers,
      pagination: {
        currentPage: pagination.currentPage,
        perPage: pagination.perPage,
        totalItems: pagination.totalItems,
        totalPages: pagination.totalPages,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
      },
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات العملاء',
    });
  }
});

/**
 * GET /api/admin/customers/:id
 * Get customer details with order history (auth required)
 */
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'العميل غير موجود',
      });
    }

    // Get customer's order history
    const orders = db
      .prepare(
        `SELECT o.id, o.order_number, o.total, o.currency, o.order_status, o.payment_status, o.created_at,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
         FROM orders o
         WHERE o.customer_phone = ?
         ORDER BY o.created_at DESC`
      )
      .all(customer.phone);

    // Add status labels to orders
    const ORDER_STATUSES = {
      new: 'جديد',
      confirmed: 'مؤكد',
      processing: 'قيد التجهيز',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
      returned: 'مرتجع',
    };

    const enrichedOrders = orders.map((o) => ({
      ...o,
      status_label: ORDER_STATUSES[o.order_status] || o.order_status,
    }));

    res.json({
      success: true,
      data: {
        ...customer,
        orders: enrichedOrders,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات العميل',
    });
  }
});

module.exports = router;
