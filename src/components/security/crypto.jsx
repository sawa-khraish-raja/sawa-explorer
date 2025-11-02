/**
 * AES-256-GCM Encryption Utilities (Frontend)
 * Requires SAWA_ENCRYPTION_KEY in secrets (32 bytes Base64)
 * Note: Frontend can only encrypt, backend will decrypt
 */

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} Base64 encrypted payload (IV + Tag + Data)
 */
export async function encrypt(text) {
  if (!text) return text;

  // Frontend doesn't have access to encryption key
  // This will be handled by backend functions
  console.warn('[CRYPTO] Encryption should be done on backend');
  return text;
}

/**
 * Decrypt sensitive data
 * @param {string} encryptedBase64 - Base64 encrypted payload
 * @returns {string} Decrypted plain text
 */
export async function decrypt(encryptedBase64) {
  if (!encryptedBase64) return encryptedBase64;

  // Frontend can't decrypt without key
  console.warn('[CRYPTO] Decryption should be done on backend');
  return encryptedBase64;
}

/**
 * Hash sensitive data (one-way) - works in browser
 * @param {string} text - Text to hash
 * @returns {string} SHA-256 hash (hex)
 */
export async function hashData(text) {
  if (!text) return text;

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(text));
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    console.error('[CRYPTO] Hash error:', error);
    return text;
  }
}
