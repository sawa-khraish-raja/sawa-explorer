/**
 * User Privacy & Display Utilities
 * Ensures only first name is shown between travelers and hosts
 */

/**
 * Extract first name only from full name
 * @param {string} fullName - User's full name
 * @param {string} email - User's email (fallback)
 * @returns {string} - First name only
 */
export function getFirstName(fullName, email = '') {
  if (!fullName && !email) return 'User';

  const name = fullName || email.split('@')[0];
  const firstName = name.trim().split(/\s+/)[0]; // Get first word

  return firstName.charAt(0).toUpperCase() + firstName.slice(1);
}

/**
 * Get display name for user (first name only for privacy)
 * @param {object} user - User object
 * @returns {string} - First name only
 */
export function getUserDisplayName(user) {
  if (!user) {
    return 'User';
  }

  //  Try display_name first (if set, it's already first name)
  if (user.display_name) {
    return user.display_name;
  }

  //  Extract first name from full_name
  if (user.full_name) {
    return getFirstName(user.full_name);
  }

  //  Fallback to email
  if (user.email) {
    return getFirstName('', user.email);
  }

  return 'User';
}

/**
 * Mask email for privacy (show only first 3 chars)
 * @param {string} email - Email address
 * @returns {string} - Masked email
 */
export function maskEmail(email) {
  if (!email) return '';
  const [localPart, domain] = email.split('@');
  if (!domain) return email;

  const visibleChars = Math.min(3, localPart.length);
  const masked = `${localPart.substring(0, visibleChars)  }***`;
  return `${masked}@${domain}`;
}

/**
 * Mask phone number for privacy
 * @param {string} phone - Phone number
 * @returns {string} - Masked phone
 */
export function maskPhone(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';

  const lastFour = cleaned.slice(-4);
  return `***${lastFour}`;
}

/**
 * Check if user should see full details (admin only)
 * @param {object} currentUser - Current logged in user
 * @returns {boolean}
 */
export function canSeeFullDetails(currentUser) {
  return currentUser?.role_type === 'admin' || currentUser?.role === 'admin';
}
