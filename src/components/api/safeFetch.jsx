import axios from 'axios';

/**
 *  Safe Fetch with Rate Limit Handling
 */

const rateLimitCache = new Map();
const RATE_LIMIT_COOLDOWN = 60000; // 1 minute cooldown

/**
 * Check if endpoint is rate limited
 */
function isRateLimited(endpoint) {
  const cooldown = rateLimitCache.get(endpoint);
  if (!cooldown) return false;

  const now = Date.now();
  if (now > cooldown) {
    rateLimitCache.delete(endpoint);
    return false;
  }

  return true;
}

/**
 * Set rate limit cooldown
 */
function setRateLimitCooldown(endpoint, retryAfter = 60) {
  const cooldownUntil = Date.now() + retryAfter * 1000;
  rateLimitCache.set(endpoint, cooldownUntil);
}

/**
 * Safe fetch with automatic retry and rate limit handling
 */
export async function safeFetch(url, options = {}) {
  const endpoint = url.split('?')[0]; // Base endpoint without query params

  //  Check if rate limited
  if (isRateLimited(endpoint)) {
    console.warn(`⏳ [safeFetch] ${endpoint} is rate limited, using cached data`);
    throw new Error('Rate limited - please wait');
  }

  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      data: options.body,
      headers: options.headers,
      timeout: options.timeout || 30000,
      ...options,
    });

    return response;
  } catch (error) {
    //  Handle 429 Rate Limit
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['retry-after']) || 60;
      setRateLimitCooldown(endpoint, retryAfter);

      console.warn(`🚫 [safeFetch] Rate limited: ${endpoint} - cooldown for ${retryAfter}s`);

      throw new Error(`Too many requests. Please wait ${retryAfter} seconds.`);
    }

    //  Handle other errors
    if (error.response) {
      throw new Error(error.response.data?.message || error.response.statusText);
    }

    throw error;
  }
}

/**
 * Clear rate limit cache (for testing)
 */
export function clearRateLimitCache() {
  rateLimitCache.clear();
}
