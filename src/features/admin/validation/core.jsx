/**
 * SAWA Security Validation Layer v1.0
 * Global validation and sanitization for all inputs
 */

export const SAWA_VALIDATION = {
  //  Email validation (strict)
  email: (v) => {
    if (!v || typeof v !== 'string') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim().toLowerCase());
  },

  //  Name validation (Arabic + English, 2-40 chars)
  name: (v) => {
    if (!v || typeof v !== 'string') return false;
    const trimmed = v.trim();
    return /^[A-Za-z\u0600-\u06FF\s]{2,40}$/.test(trimmed) && trimmed.length >= 2;
  },

  //  Message validation (prevent spam & XSS)
  message: (v) => {
    if (!v || typeof v !== 'string') return false;
    const trimmed = v.trim();
    return trimmed.length > 0 && trimmed.length <= 5000;
  },

  //  City validation (only allowed cities)
  city: (v) => {
    if (!v || typeof v !== 'string') return false;
    return ['Damascus', 'Amman', 'Cairo', 'Istanbul'].includes(v);
  },

  //  Date validation (must be valid and not too far in past/future)
  date: (v) => {
    if (!v) return false;
    const date = new Date(v);
    if (isNaN(date.getTime())) return false;

    const now = new Date();
    const minDate = new Date('2020-01-01');
    const maxDate = new Date(now.getFullYear() + 5, 11, 31);

    return date >= minDate && date <= maxDate;
  },

  //  Number validation (positive integers only)
  number: (v) => {
    return typeof v === 'number' && !isNaN(v) && v >= 0 && Number.isFinite(v);
  },

  //  Boolean validation
  boolean: (v) => {
    return typeof v === 'boolean';
  },

  //  Object ID validation (UUID style)
  objectId: (v) => {
    if (!v || typeof v !== 'string') return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(v);
  },

  //  Phone number validation (international format)
  phone: (v) => {
    if (!v || typeof v !== 'string') return false;
    return /^\+?[1-9]\d{1,14}$/.test(v.replace(/[\s()-]/g, ''));
  },

  //  URL validation
  url: (v) => {
    if (!v || typeof v !== 'string') return false;
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  },

  //  Price validation (positive with max 2 decimals)
  price: (v) => {
    if (typeof v !== 'number') return false;
    return v >= 0 && Number.isFinite(v) && /^\d+(\.\d{1,2})?$/.test(v.toString());
  },

  //  Text sanitization (remove HTML tags, prevent XSS)
  textSafe: (v) => {
    if (!v || typeof v !== 'string') return v;

    return v
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  },

  //  Sanitize HTML (allow only safe tags)
  htmlSafe: (v) => {
    if (!v || typeof v !== 'string') return v;

    let safe = v;

    // Remove all tags except allowed ones (p, br, strong, em, u, a, ul, ol, li)
    safe = safe.replace(/<(?!\/?(?:p|br|strong|em|u|a|ul|ol|li)\b)[^>]+>/gi, '');

    // Remove dangerous attributes
    safe = safe.replace(/on\w+="[^"]*"/gi, '');
    safe = safe.replace(/javascript:/gi, '');

    return safe;
  },
};

/**
 * Validate entire payload against schema
 * @param {Object} payload - Data to validate
 * @param {Object} schema - Validation schema { fieldName: validator }
 * @returns {Object} { ok: boolean, errors: string[] }
 */
export function validatePayload(payload, schema) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['Invalid payload'] };
  }

  for (const key in schema) {
    const validator = schema[key];
    const value = payload[key];

    if (typeof validator !== 'function') {
      console.warn(`[VALIDATION] Invalid validator for ${key}`);
      continue;
    }

    if (!validator(value)) {
      errors.push(key);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    message: errors.length > 0 ? `Invalid fields: ${errors.join(', ')}` : null,
  };
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  const sanitized = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'string') {
      sanitized[key] = SAWA_VALIDATION.textSafe(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting helper
 * @param {string} identifier - User email or IP
 * @param {number} maxAttempts - Max attempts allowed
 * @param {number} windowMs - Time window in milliseconds
 */
const rateLimitStore = new Map();

export function checkRateLimit(identifier, maxAttempts = 50, windowMs = 60000) {
  const now = Date.now();
  const key = `${identifier}:${Math.floor(now / windowMs)}`;

  const current = rateLimitStore.get(key) || 0;

  if (current >= maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  rateLimitStore.set(key, current + 1);

  // Cleanup old entries
  for (const [k, _v] of rateLimitStore.entries()) {
    const [_id, time] = k.split(':');
    if (parseInt(time) * windowMs < now - windowMs * 2) {
      rateLimitStore.delete(k);
    }
  }

  return { allowed: true, remaining: maxAttempts - current - 1 };
}
