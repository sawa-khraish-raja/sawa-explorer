export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;

  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
};

export const sanitizeHTML = (html) => {
  if (typeof html !== 'string') return html;

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
};

export const validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const escapeHTML = (str) => {
  if (typeof str !== 'string') return str;

  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
};

export const preventXSS = (obj) => {
  if (typeof obj !== 'object' || obj === null) return obj;

  const cleaned = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      cleaned[key] = sanitizeInput(obj[key]);
    } else if (typeof obj[key] === 'object') {
      cleaned[key] = preventXSS(obj[key]);
    } else {
      cleaned[key] = obj[key];
    }
  }

  return cleaned;
};

export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

export const generateCSRFToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const validateCSRFToken = (token, storedToken) => {
  return token === storedToken;
};
