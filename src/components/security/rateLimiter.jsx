/**
 * Client-side Rate Limiter Helper
 * Works with backend rate limiting
 */

const REQUESTS = new Map();

/**
 * Check if request should be rate limited (client-side preview)
 * @param {string} key - Identifier (user email, action type, etc.)
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {boolean} True if allowed
 */
export function checkClientRateLimit(key, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  let entry = REQUESTS.get(key);
  
  // Clean old entries
  if (entry && now > entry.reset) {
    REQUESTS.delete(key);
    entry = null;
  }
  
  if (!entry) {
    entry = {
      count: 0,
      reset: now + windowMs
    };
  }
  
  entry.count++;
  REQUESTS.set(key, entry);
  
  return entry.count <= maxRequests;
}

/**
 * Clear rate limit for key
 */
export function clearRateLimit(key) {
  REQUESTS.delete(key);
}

/**
 * Get remaining requests
 */
export function getRemainingRequests(key, maxRequests = 60) {
  const entry = REQUESTS.get(key);
  if (!entry) return maxRequests;
  
  return Math.max(0, maxRequests - entry.count);
}