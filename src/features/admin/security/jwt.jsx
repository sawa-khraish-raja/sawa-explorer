/* global Deno */
/**
 * JWT Utilities for Admin Authentication
 * Requires SAWA_JWT_SECRET in secrets
 */

/**
 * Create HMAC signature for JWT
 */
async function hmacSign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));

  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Issue JWT token
 * @param {Object} payload - Data to encode
 * @param {string} expiresIn - Expiry time (e.g., '12h', '7d')
 * @returns {string} JWT token
 */
export async function issueJWT(payload, expiresIn = '12h') {
  const JWT_SECRET = typeof Deno !== 'undefined' ? Deno.env.get('SAWA_JWT_SECRET') : null;

  if (!JWT_SECRET) {
    throw new Error('SAWA_JWT_SECRET not configured');
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  // Calculate expiry
  const now = Math.floor(Date.now() / 1000);
  const expirySeconds = parseExpiry(expiresIn);

  const claims = {
    ...payload,
    iat: now,
    exp: now + expirySeconds,
  };

  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(claims)).replace(/=/g, '');

  const message = `${headerB64}.${payloadB64}`;
  const signature = await hmacSign(message, JWT_SECRET);

  return `${message}.${signature}`;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} { ok: boolean, data?: Object, error?: string }
 */
export async function verifyJWT(token) {
  const JWT_SECRET = typeof Deno !== 'undefined' ? Deno.env.get('SAWA_JWT_SECRET') : null;

  if (!JWT_SECRET) {
    return { ok: false, error: 'JWT secret not configured' };
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { ok: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64, signatureB64] = parts;

    // Verify signature
    const message = `${headerB64}.${payloadB64}`;
    const expectedSignature = await hmacSign(message, JWT_SECRET);

    if (signatureB64 !== expectedSignature) {
      return { ok: false, error: 'Invalid signature' };
    }

    // Decode payload
    const payload = JSON.parse(atob(payloadB64));

    // Check expiry
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { ok: false, error: 'Token expired' };
    }

    return { ok: true, data: payload };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/**
 * Parse expiry string to seconds
 */
function parseExpiry(expiresIn) {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 43200; // 12h default

  const [, num, unit] = match;
  const value = parseInt(num);

  const units = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };

  return value * (units[unit] || 3600);
}
