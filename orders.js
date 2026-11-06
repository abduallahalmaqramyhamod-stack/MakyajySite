// Order routes - Create orders, track, admin management

const express = require('express');
const { getDb } = require('../database/init');
const { authenticate, logActivity } = require('../middleware/auth');
const { validateOrderInput } = require('../middleware/validate');
const { generateOrderNumber, paginate } = require('../utils/helpers');

const router = express.Router();

// Valid order statuses and their Arabic labels
const ORDER_STATUSES = {
  new: 'جديد',
  confirmed: 'مؤكد',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
  returned: 'مرتجع',
};

const PAYMENT_STATUSES = {
  pending: 'قيد الانتظار',
  paid: 'مدفوع',
  failed: 'فشل',
  refunded: 'مسترد',
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * POST /api/orders
 * Create a new order (public)
 * Validates stock, calculates prices server-side, generates order number
 */
router.post('/', validateOrderInput, (req, res) => {
  try {
    const db = getDb();
    const {
      customer_name,
      customer_phone,
      customer_email,
      governorate,
      area,
      address_detail,
      notes,
      items,
      payment_method = 'cash_on_delivery',
    } = req.body;

    // Start transaction for atomicity
    const transaction = db.transaction(() => {
      let subtotal = 0;
      const orderItems = [];

      // Validate each item and calculate prices from the database
      for (const item of items) {
        const product = db
          .prepare('SELECT id, name, sku, price, stock_quantity, is_active FROM products WHERE id = ?')
          .get(item.product_id);

        if (!product) {
          throw new Error(`المنتج غير موجود: ${item.product_id}`);
        }

        if (!product.is_active) {
          throw new Error(`المنتج "${product.name}" غير متاح حالياً`);
        }

        if (product.stock_quantity < item.quantity) {
          throw new Error(
            `الكمية المطلوبة من "${product.name}" غير متوفرة. المتاح: ${product.stock_quantity}`
          );
        }

        // Get variant info if specified
        let variantInfo = null;
        let priceAdjustment = 0;
        if (item.variant_id) {
          const variant = db
            .prepare('SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1')
            .get(item.variant_id, item.product_id);

          if (variant) {
            variantInfo = JSON.stringify({ id: variant.id, name: variant.name, value: variant.value });
            priceAdjustment = variant.price_adjustment || 0;

            // Check variant stock
            if (variant.stock_quantity !== null && variant.stock_quantity < item.quantity) {
              throw new Error(
                `الكمية المطلوبة من "${product.name}" (${variant.value}) غير متوفرة`
              );
            }

            // Decrease variant stock
            if (variant.stock_quantity !== null) {
              db.prepare('UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?').run(
                item.quantity,
                variant.id
              );
            }
          }
        }

        const unitPrice = product.price + priceAdjustment;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          product_sku: product.sku,
          variant_info: variantInfo,
          quantity: item.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
        });

        // Decrease product stock
        db.prepare('UPDATE products SET stock_quantity = stock_quantity - ?, sales_count = sales_count + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
          item.quantity,
          item.quantity,
          product.id
        );
      }

      // Get shipping fee for the governorate
      let shippingFee = 0;
      const shipping = db
        .prepare('SELECT fee FROM shipping_fees WHERE governorate = ? AND is_active = 1')
        .get(governorate);
      if (shipping) {
        shippingFee = shipping.fee;
      }

      // Check free shipping threshold
      const freeShippingThreshold = db
        .prepare("SELECT value FROM settings WHERE key = 'free_shipping_threshold'")
        .get();
      if (
        freeShippingThreshold &&
        Number(freeShippingThreshold.value) > 0 &&
        subtotal >= Number(freeShippingThreshold.value)
      ) {
        shippingFee = 0;
      }

      const total = subtotal + shippingFee;

      // Generate unique order number
      let orderNumber = generateOrderNumber();
      let existingOrder = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber);
      while (existingOrder) {
        orderNumber = generateOrderNumber();
        existingOrder = db.prepare('SELECT id FROM orders WHERE order_number = ?').get(orderNumber);
      }

      // Create initial status history
      const statusHistory = [
        {
          status: 'new',
          label: ORDER_STATUSES.new,
          date: new Date().toISOString(),
          note: 'تم إنشاء الطلب',
        },
      ];

      // Insert order
      const orderResult = db
        .prepare(
          `INSERT INTO orders (order_number, customer_name, customer_phone, customer_email, governorate, area, address_detail, notes, subtotal, shipping_fee, total, currency, payment_method, payment_status, order_status, status_history)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'YER', ?, 'pending', 'new', ?)`
        )
        .run(
          orderNumber,
          customer_name.trim(),
          customer_phone.trim(),
          customer_email ? customer_email.trim() : null,
          governorate.trim(),
          area.trim(),
          address_detail.trim(),
          notes ? notes.trim() : null,
          subtotal,
          shippingFee,
          total,
          payment_method,
          JSON.stringify(statusHistory)
        );

      const orderId = orderResult.lastInsertRowid;

      // Insert order items
      const insertItem = db.prepare(
        'INSERT INTO order_items (order_id, product_id, product_name, product_sku, variant_info, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const item of orderItems) {
        insertItem.run(
          orderId,
          item.product_id,
          item.product_name,
          item.product_sku,
          item.variant_info,
          item.quantity,
          item.unit_price,
          item.total_price
        );
      }

      // Create or update customer record
      const existingCustomer = db
        .prepare('SELECT id FROM customers WHERE phone = ?')
        .get(customer_phone.trim());

      if (existingCustomer) {
        db.prepare(
          `UPDATE customers SET
            name = ?, email = ?, governorate = ?, area = ?, address = ?,
            total_orders = total_orders + 1, total_spent = total_spent + ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
        ).run(
          customer_name.trim(),
          customer_email ? customer_email.trim() : null,
          governorate.trim(),
          area.trim(),
          address_detail.trim(),
          total,
          existingCustomer.id
        );
      } else {
        db.prepare(
          'INSERT INTO customers (name, phone, email, governorate, area, address, total_orders, total_spent) VALUES (?, ?, ?, ?, ?, ?, 1, ?)'
        ).run(
          customer_name.trim(),
          customer_phone.trim(),
          customer_email ? customer_email.trim() : null,
          governorate.trim(),
          area.trim(),
          address_detail.trim(),
          total
        );
      }

      // Log activity
      logActivity({
        userId: null,
        action: 'create_order',
        entityType: 'order',
        entityId: orderId,
        details: { order_number: orderNumber, total, items_count: orderItems.length },
        ipAddress: null,
      });

      return {
        id: orderId,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        total,
        items: orderItems,
      };
    });

    const result = transaction();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الطلب بنجاح',
      data: result,
    });
  } catch (error) {
    console.error('Create order error:', error);

    // Check if it's a validation error from our transaction
    if (error.message && !error.message.includes('SQLITE')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء الطلب',
    });
  }
});

/**
 * GET /api/orders/track/:orderNumber
 * Track an order by its order number (public)
 */
router.get('/track/:orderNumber', (req, res) => {
  try {
    const db = getDb();
    const { orderNumber } = req.params;

    const order = db
      .prepare(
        `SELECT order_number, customer_name, governorate, area, subtotal, shipping_fee, discount_amount, total, currency, payment_method, payment_status, order_status, status_history, created_at
         FROM orders WHERE order_number = ?`
      )
      .get(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود. يرجى التحقق من رقم الطلب',
      });
    }

    // Get order items
    const items = db
      .prepare(
        'SELECT product_name, variant_info, quantity, unit_price, total_price FROM order_items WHERE order_id = (SELECT id FROM orders WHERE order_number = ?)'
      )
      .all(orderNumber);

    // Parse status history
    let statusHistory = [];
    try {
      statusHistory = JSON.parse(order.status_history || '[]');
    } catch {
      statusHistory = [];
    }

    res.json({
      success: true,
      data: {
        ...order,
        status_history: statusHistory,
        status_label: ORDER_STATUSES[order.order_status] || order.order_status,
        payment_status_label: PAYMENT_STATUSES[order.payment_status] || order.payment_status,
        items,
      },
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في تتبع الطلب',
    });
  }
});

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * GET /api/admin/orders
 * List all orders with filters (auth required)
 */
router.get('/admin', authenticate, (req, res) => {
  try {
    const db = getDb();
    const {
      page = 1,
      limit = 20,
      status,
      payment_status,
      search,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'desc',
    } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('order_status = ?');
      params.push(status);
    }

    if (payment_status) {
      where.push('payment_status = ?');
      params.push(payment_status);
    }

    if (search) {
      where.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (date_from) {
      where.push('DATE(created_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      where.push('DATE(created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countRow = db.prepare(`SELECT COUNT(*) as count FROM orders ${whereClause}`).get(...params);
    const pagination = paginate(page, limit, countRow.count);

    const allowedSorts = {
      created_at: 'created_at',
      total: 'total',
      order_number: 'order_number',
    };
    const sortCol = allowedSorts[sort] || 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const orders = db
      .prepare(
        `SELECT * FROM orders ${whereClause}
         ORDER BY ${sortCol} ${sortOrder}
         LIMIT ? OFFSET ?`
      )
      .all(...params, pagination.perPage, pagination.offset);

    // Add labels
    const enrichedOrders = orders.map((o) => ({
      ...o,
      status_label: ORDER_STATUSES[o.order_status] || o.order_status,
      payment_status_label: PAYMENT_STATUSES[o.payment_status] || o.payment_status,
      items_count: db.prepare('SELECT COUNT(*) as count FROM order_items WHERE order_id = ?').get(o.id).count,
    }));

    res.json({
      success: true,
      data: enrichedOrders,
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
    console.error('List orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب الطلبات',
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get full order details (auth required)
 */
router.get('/admin/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);

    let statusHistory = [];
    try {
      statusHistory = JSON.parse(order.status_history || '[]');
    } catch {
      statusHistory = [];
    }

    // Get customer info
    const customer = db
      .prepare('SELECT * FROM customers WHERE phone = ?')
      .get(order.customer_phone);

    res.json({
      success: true,
      data: {
        ...order,
        status_label: ORDER_STATUSES[order.order_status] || order.order_status,
        payment_status_label: PAYMENT_STATUSES[order.payment_status] || order.payment_status,
        status_history: statusHistory,
        items,
        customer: customer || null,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ في جلب بيانات الطلب',
    });
  }
});

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status (auth required)
 */
router.patch('/admin/:id/status', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status || !ORDER_STATUSES[status]) {
      return res.status(400).json({
        success: false,
        message: 'حالة الطلب غير صالحة',
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    // Parse current status history
    let statusHistory = [];
    try {
      statusHistory = JSON.parse(order.status_history || '[]');
    } catch {
      statusHistory = [];
    }

    // Add new status entry
    statusHistory.push({
      status,
      label: ORDER_STATUSES[status],
      date: new Date().toISOString(),
      note: note || null,
      changed_by: req.user.username,
    });

    // If cancelled, restore stock
    if (status === 'cancelled' && order.order_status !== 'cancelled') {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
      for (const item of items) {
        db.prepare(
          'UPDATE products SET stock_quantity = stock_quantity + ?, sales_count = sales_count - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).run(item.quantity, item.quantity, item.product_id);

        // Restore variant stock if applicable
        if (item.variant_info) {
          try {
            const variantData = JSON.parse(item.variant_info);
            if (variantData.id) {
              db.prepare(
                'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?'
              ).run(item.quantity, variantData.id);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    db.prepare(
      'UPDATE orders SET order_status = ?, status_history = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, JSON.stringify(statusHistory), id);

    logActivity({
      userId: req.user.id,
      action: 'update_order_status',
      entityType: 'order',
      entityId: Number(id),
      details: {
        order_number: order.order_number,
        from: order.order_status,
        to: status,
        note,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `تم تحديث حالة الطلب إلى "${ORDER_STATUSES[status]}"`,
      data: {
        order_status: status,
        status_label: ORDER_STATUSES[status],
        status_history: statusHistory,
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الطلب',
    });
  }
});

/**
 * PATCH /api/admin/orders/:id/payment
 * Update payment status (auth required)
 */
router.patch('/admin/:id/payment', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { payment_status } = req.body;

    if (!payment_status || !PAYMENT_STATUSES[payment_status]) {
      return res.status(400).json({
        success: false,
        message: 'حالة الدفع غير صالحة',
      });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
      });
    }

    db.prepare(
      'UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(payment_status, id);

    logActivity({
      userId: req.user.id,
      action: 'update_payment_status',
      entityType: 'order',
      entityId: Number(id),
      details: {
        order_number: order.order_number,
        from: order.payment_status,
        to: payment_status,
      },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: `تم تحديث حالة الدفع إلى "${PAYMENT_STATUSES[payment_status]}"`,
      data: {
        payment_status,
        payment_status_label: PAYMENT_STATUSES[payment_status],
      },
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث حالة الدفع',
    });
  }
});

/**
 * GET /api/admin/orders/export
 * Export orders as CSV (auth required)
 */
router.get('/admin-export', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { status, date_from, date_to } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('o.order_status = ?');
      params.push(status);
    }

    if (date_from) {
      where.push('DATE(o.created_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      where.push('DATE(o.created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const orders = db
      .prepare(
        `SELECT o.*, GROUP_CONCAT(oi.product_name || ' x' || oi.quantity, ' | ') as items_summary
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         ${whereClause}
         GROUP BY o.id
         ORDER BY o.created_at DESC`
      )
      .all(...params);

    // Build CSV
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel Arabic support
    const headers = [
      'رقم الطلب',
      'اسم العميل',
      'رقم الهاتف',
      'المحافظة',
      'المنطقة',
      'العنوان',
      'المنتجات',
      'المجموع الفرعي',
      'رسوم الشحن',
      'الخصم',
      'الإجمالي',
      'طريقة الدفع',
      'حالة الدفع',
      'حالة الطلب',
      'تاريخ الإنشاء',
    ];

    let csv = BOM + headers.join(',') + '\n';

    for (const order of orders) {
      const row = [
        order.order_number,
        `"${(order.customer_name || '').replace(/"/g, '""')}"`,
        order.customer_phone,
        `"${(order.governorate || '').replace(/"/g, '""')}"`,
        `"${(order.area || '').replace(/"/g, '""')}"`,
        `"${(order.address_detail || '').replace(/"/g, '""')}"`,
        `"${(order.items_summary || '').replace(/"/g, '""')}"`,
        order.subtotal,
        order.shipping_fee,
        order.discount_amount,
        order.total,
        order.payment_method,
        PAYMENT_STATUSES[order.payment_status] || order.payment_status,
        ORDER_STATUSES[order.order_status] || order.order_status,
        order.created_at,
      ];
      csv += row.join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تصدير الطلبات',
    });
  }
});

module.exports = router;
