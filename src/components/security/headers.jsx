/**
 * Secure Headers Configuration (Frontend)
 * Backend should also set these
 */

/**
 * Get recommended security headers for fetch requests
 */
export function getSecureRequestHeaders(csrfToken = null) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  if (csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }
  
  return headers;
}

/**
 * Create device fingerprint
 * @returns {string} Device fingerprint hash
 */
export async function createDeviceFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.deviceMemory || 0
  ];
  
  const fingerprint = components.join('|');
  
  // Hash it
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));
  
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

/**
 * Store device fingerprint in cookie
 */
export async function storeDeviceFingerprint() {
  const existing = document.cookie
    .split('; ')
    .find(row => row.startsWith('sawa.dev='));
    
  if (existing) return existing.split('=')[1];
  
  const fingerprint = await createDeviceFingerprint();
  
  document.cookie = `sawa.dev=${fingerprint}; path=/; secure; samesite=lax; max-age=${180*24*60*60}`;
  
  return fingerprint;
}

/**
 * Get device fingerprint from cookie
 */
export function getDeviceFingerprint() {
  const cookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('sawa.dev='));
    
  return cookie ? cookie.split('=')[1] : null;
}