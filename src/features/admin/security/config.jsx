/* global Deno */
/**
 * SAWA Security Configuration
 * All security settings in one place
 */

export const SAWA_SECURITY_CONFIG = {
  // Session settings
  SESSION_COOKIE_NAME: 'sawa.sid',
  CSRF_COOKIE_NAME: 'sawa.csrf',
  DEVICE_COOKIE_NAME: 'sawa.dev',
  STEPUP_COOKIE_NAME: 'sawa.stepup',

  // Timeouts (in seconds)
  SESSION_MAX_AGE: 7 * 24 * 60 * 60, // 7 days
  CSRF_MAX_AGE: 12 * 60 * 60, // 12 hours
  STEPUP_MAX_AGE: 10 * 60, // 10 minutes
  DEVICE_MAX_AGE: 180 * 24 * 60 * 60, // 180 days

  // Rate limits
  DEFAULT_RATE_LIMIT: 60, // requests per minute
  ADMIN_RATE_LIMIT: 40,
  LOGIN_RATE_LIMIT: 5,
  ANOMALY_THRESHOLD: 40, // requests per minute to trigger step-up

  // DLP patterns (from env or defaults)
  DLP_PATTERNS: getDLPPatterns(),

  // Admin IP allowlist (from env)
  ADMIN_IP_ALLOWLIST: getAdminIPs(),

  // Allowed origins (from env)
  ALLOWED_ORIGINS: getAllowedOrigins(),
};

function getDLPPatterns() {
  // Frontend doesn't have access to env vars, return defaults
  if (typeof window !== 'undefined') {
    return {
      phone: '\\+?[0-9]{7,15}',
      email: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
      card: '\\b(?:\\d[ -]*?){13,19}\\b',
    };
  }

  // Backend (Deno) - read from env
  const envPatterns = typeof Deno !== 'undefined' ? Deno.env.get('SAWA_DLP_REGEX_JSON') : null;

  if (envPatterns) {
    try {
      return JSON.parse(envPatterns);
    } catch (e) {
      console.warn('[SECURITY] Invalid DLP_REGEX_JSON, using defaults');
    }
  }

  return {
    phone: '\\+?[0-9]{7,15}',
    email: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}',
    card: '\\b(?:\\d[ -]*?){13,19}\\b',
  };
}

function getAdminIPs() {
  // Frontend doesn't need this
  if (typeof window !== 'undefined') {
    return [];
  }

  const envIPs = typeof Deno !== 'undefined' ? Deno.env.get('SAWA_ADMIN_IP_ALLOWLIST') : null;

  if (!envIPs) return [];

  return envIPs
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function getAllowedOrigins() {
  // Frontend doesn't need this
  if (typeof window !== 'undefined') {
    return ['https://sawa-explorer.base44.app'];
  }

  const envOrigins = typeof Deno !== 'undefined' ? Deno.env.get('SAWA_ALLOWED_ORIGINS') : null;

  if (!envOrigins) return ['https://sawa-explorer.base44.app'];

  return envOrigins
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
