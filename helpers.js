// Utility helper functions for the Makeupi store backend

/**
 * Generate a unique order number in the format MKP-YYYYMMDD-XXXX
 * @returns {string} Order number
 */
function generateOrderNumber() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;
  const randomPart = String(Math.floor(1000 + Math.random() * 9000));
  return `MKP-${datePart}-${randomPart}`;
}

/**
 * Generate a URL-safe slug from text (supports Arabic)
 * @param {string} text - The text to slugify
 * @returns {string} URL-safe slug
 */
function generateSlug(text) {
  if (!text) return '';

  let slug = text
    .toString()
    .trim()
    .toLowerCase()
    // Replace Arabic spaces and special chars
    .replace(/\s+/g, '-')
    // Remove special characters except Arabic letters, numbers, and hyphens
    .replace(/[^\u0600-\u06FF\u0750-\u077Fa-z0-9\-]/g, '')
    // Replace multiple hyphens with single
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // If slug is empty (all special chars), generate a random one
  if (!slug) {
    slug = 'item-' + Date.now().toString(36);
  }

  return slug;
}

/**
 * Ensure slug uniqueness by appending a counter suffix
 * @param {object} db - Database instance
 * @param {string} table - Table name
 * @param {string} slug - Base slug
 * @param {number|null} excludeId - ID to exclude from uniqueness check (for updates)
 * @returns {string} Unique slug
 */
function ensureUniqueSlug(db, table, slug, excludeId = null) {
  let candidate = slug;
  let counter = 1;

  while (true) {
    let row;
    if (excludeId) {
      row = db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(candidate, excludeId);
    } else {
      row = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(candidate);
    }

    if (!row) return candidate;
    candidate = `${slug}-${counter}`;
    counter++;
  }
}

/**
 * Format currency value
 * @param {number} amount - The amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'YER') {
  const symbols = {
    YER: 'ر.ي',
    USD: '$',
    SAR: 'ر.س',
    AED: 'د.إ',
  };
  const symbol = symbols[currency] || currency;
  const formatted = Number(amount).toLocaleString('ar-YE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${symbol}`;
}

/**
 * Calculate discount percentage between original and sale price
 * @param {number} originalPrice - Original price
 * @param {number} salePrice - Sale/current price
 * @returns {number} Discount percentage (0-100)
 */
function calculateDiscountPercentage(originalPrice, salePrice) {
  if (!originalPrice || !salePrice || originalPrice <= 0 || salePrice >= originalPrice) {
    return 0;
  }
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

/**
 * Build pagination response object
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalItems - Total number of items
 * @returns {object} Pagination metadata
 */
function paginate(page, limit, totalItems) {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const perPage = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const totalPages = Math.ceil(totalItems / perPage);
  const offset = (currentPage - 1) * perPage;

  return {
    currentPage,
    perPage,
    totalItems,
    totalPages,
    offset,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
}

/**
 * Sanitize a string to prevent basic XSS
 * @param {string} str - Input string
 * @returns {string} Sanitized string
 */
function sanitize(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Generate a random alphanumeric string
 * @param {number} length - Desired length
 * @returns {string} Random string
 */
function randomString(length = 16) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Parse JSON safely, returning default value on failure
 * @param {string} str - JSON string
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed value or default
 */
function safeJsonParse(str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

module.exports = {
  generateOrderNumber,
  generateSlug,
  ensureUniqueSlug,
  formatCurrency,
  calculateDiscountPercentage,
  paginate,
  sanitize,
  randomString,
  safeJsonParse,
};
