/**
 * Frontend Audit Logger
 * Logs security events to backend
 */

import { safePost } from '@/api/safeFetch.js';

/**
 * Log security event
 * @param {string} event - Event name
 * @param {Object} details - Event details
 */
export async function auditLog(event, details = {}) {
  try {
    console.log('[AUDIT]', event, details);

    // Send to backend (if audit endpoint exists)
    await safePost('/api/audit', {
      event,
      details,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    }).catch(() => {
      // Silently fail if audit endpoint doesn't exist (e.g., in local dev without backend)
    });
  } catch (error) {
    console.warn('[AUDIT] Failed to log:', error);
  }
}

/**
 * Common audit events
 */
export const AUDIT_EVENTS = {
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  BOOKING_CREATED: 'booking_created',
  OFFER_SENT: 'offer_sent',
  MESSAGE_SENT: 'message_sent',
  PROFILE_UPDATED: 'profile_updated',
  PAYMENT_INITIATED: 'payment_initiated',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  STEP_UP_TRIGGERED: 'step_up_triggered',
  DEVICE_CHANGED: 'device_changed',
};
