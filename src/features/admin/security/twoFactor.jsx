/**
 * 2FA Frontend Helper (for admin login)
 */

/**
 * Format TOTP input (auto-spacing)
 */
export function formatTOTPInput(value) {
  // Remove non-digits
  const digits = value.replace(/\D/g, '');

  // Limit to 6 digits
  return digits.substring(0, 6);
}

/**
 * Validate TOTP format
 */
export function isValidTOTPFormat(value) {
  return /^\d{6}$/.test(value);
}

/**
 * Generate QR code display URL
 */
export function getQRCodeDisplayURL(otpauth) {
  return `https://chart.googleapis.com/chart?chs=300x300&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauth)}`;
}
