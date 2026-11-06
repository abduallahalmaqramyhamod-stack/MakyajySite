// Input validation middleware and helper functions

/**
 * Validate that required fields are present in the request body
 * @param  {...string} fields - Required field names
 * @returns {Function} Express middleware
 */
function required(...fields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
      const value = req.body[field];
      if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      const fieldNames = {
        name: 'الاسم',
        username: 'اسم المستخدم',
        password: 'كلمة المرور',
        price: 'السعر',
        customer_name: 'اسم العميل',
        customer_phone: 'رقم الهاتف',
        governorate: 'المحافظة',
        area: 'المنطقة',
        address_detail: 'تفاصيل العنوان',
        items: 'المنتجات',
        email: 'البريد الإلكتروني',
        title: 'العنوان',
        image: 'الصورة',
        fee: 'الرسوم',
        code: 'الرمز',
        symbol: 'الرمز',
        exchange_rate: 'سعر الصرف',
        value: 'القيمة',
        slug: 'الرابط',
      };

      const translatedFields = missing.map((f) => fieldNames[f] || f);

      return res.status(400).json({
        success: false,
        message: `الحقول التالية مطلوبة: ${translatedFields.join('، ')}`,
      });
    }

    next();
  };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  if (!email) return true; // Email is optional in most cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (Yemeni or general)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone number is valid
 */
function isValidPhone(phone) {
  if (!phone) return false;
  // Remove spaces, dashes, and plus sign for validation
  const cleaned = phone.replace(/[\s\-\+\(\)]/g, '');
  // Allow 9-15 digit phone numbers
  return /^\d{9,15}$/.test(cleaned);
}

/**
 * Validate that a value is a positive number
 * @param {*} value - Value to check
 * @returns {boolean} Whether it's a positive number
 */
function isPositiveNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num > 0;
}

/**
 * Validate that a value is a non-negative number
 * @param {*} value - Value to check
 * @returns {boolean} Whether it's a non-negative number
 */
function isNonNegativeNumber(value) {
  const num = Number(value);
  return !isNaN(num) && num >= 0;
}

/**
 * Validate that a value is a positive integer
 * @param {*} value - Value to check
 * @returns {boolean} Whether it's a positive integer
 */
function isPositiveInteger(value) {
  const num = Number(value);
  return Number.isInteger(num) && num > 0;
}

/**
 * Sanitize a string input: trim and escape HTML entities
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Validate order items array
 * @param {Array} items - Array of order items
 * @returns {object} { valid: boolean, message: string }
 */
function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: 'يجب إضافة منتج واحد على الأقل' };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.product_id || !isPositiveInteger(item.product_id)) {
      return { valid: false, message: `معرف المنتج غير صالح في العنصر ${i + 1}` };
    }
    if (!item.quantity || !isPositiveInteger(item.quantity)) {
      return { valid: false, message: `الكمية غير صالحة في العنصر ${i + 1}` };
    }
    if (item.quantity > 100) {
      return { valid: false, message: `الكمية كبيرة جداً في العنصر ${i + 1}. الحد الأقصى 100` };
    }
  }

  return { valid: true, message: '' };
}

/**
 * Middleware to validate order creation input
 */
function validateOrderInput(req, res, next) {
  const { customer_name, customer_phone, governorate, area, address_detail, items } = req.body;

  const errors = [];

  if (!customer_name || customer_name.trim().length < 2) {
    errors.push('اسم العميل مطلوب ويجب أن يكون حرفين على الأقل');
  }

  if (!customer_phone) {
    errors.push('رقم الهاتف مطلوب');
  } else if (!isValidPhone(customer_phone)) {
    errors.push('رقم الهاتف غير صالح');
  }

  if (req.body.customer_email && !isValidEmail(req.body.customer_email)) {
    errors.push('البريد الإلكتروني غير صالح');
  }

  if (!governorate || governorate.trim() === '') {
    errors.push('المحافظة مطلوبة');
  }

  if (!area || area.trim() === '') {
    errors.push('المنطقة مطلوبة');
  }

  if (!address_detail || address_detail.trim() === '') {
    errors.push('تفاصيل العنوان مطلوبة');
  }

  const itemsValidation = validateOrderItems(items);
  if (!itemsValidation.valid) {
    errors.push(itemsValidation.message);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

/**
 * Middleware to validate product input
 */
function validateProductInput(req, res, next) {
  const { name, price } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('اسم المنتج مطلوب ويجب أن يكون حرفين على الأقل');
  }

  if (price === undefined || price === null || !isPositiveNumber(price)) {
    errors.push('سعر المنتج مطلوب ويجب أن يكون رقماً موجباً');
  }

  if (req.body.compare_price && !isNonNegativeNumber(req.body.compare_price)) {
    errors.push('سعر المقارنة يجب أن يكون رقماً');
  }

  if (req.body.stock_quantity !== undefined && !isNonNegativeNumber(req.body.stock_quantity)) {
    errors.push('كمية المخزون يجب أن تكون رقماً غير سالب');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

module.exports = {
  required,
  isValidEmail,
  isValidPhone,
  isPositiveNumber,
  isNonNegativeNumber,
  isPositiveInteger,
  sanitizeInput,
  validateOrderItems,
  validateOrderInput,
  validateProductInput,
};
