/**
 * Text Normalization & Formatting Utilities
 * Automatically cleans and formats text across the platform
 */

/**
 * Normalize text by removing underscores and cleaning formatting
 * @param {string} str - Input string
 * @returns {string} - Cleaned string
 */
export function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';

  return str
    .replaceAll('_', ' ') // Remove underscores
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim(); // Remove leading/trailing spaces
}

/**
 * Normalize and capitalize first letter of each word
 * @param {string} str - Input string
 * @returns {string} - Title case string
 */
export function normalizeTitleCase(str) {
  if (!str) return '';

  return normalizeText(str)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalize service/feature names
 * @param {string} str - Input string
 * @returns {string} - Cleaned service name
 */
export function normalizeServiceName(str) {
  if (!str) return '';

  return normalizeText(str)
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Truncate text with ellipsis
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated string
 */
export function truncateText(str, maxLength = 100) {
  if (!str) return '';
  const normalized = normalizeText(str);
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).trim() + '...';
}
