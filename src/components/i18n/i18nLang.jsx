//  Centralized Language Normalization System
// Prevents locale "auto" errors and ensures consistency

const SUPPORTED_LANGS =
  (typeof window !== 'undefined' && window.ENV?.SAWA_LANGS) || 'ar,en,de,fr,es,nl,it,sv,da,tr';

const LANGS_ARRAY = SUPPORTED_LANGS.split(',').map((s) => s.trim().toLowerCase());

const DEFAULT_LANG = (typeof window !== 'undefined' && window.ENV?.SAWA_DEFAULT_LANG) || 'en';

/**
 * Normalizes any language code to supported format
 * Prevents "locale auto" errors
 * @param {string} code - Language code (can be 'auto', 'en-US', 'ar', etc.)
 * @returns {string} Normalized language code
 */
export function normLang(code) {
  if (!code || code === 'auto' || code === 'auto-detected') {
    // Try localStorage first, then browser language, then default
    const stored =
      typeof localStorage !== 'undefined' ? localStorage.getItem('sawa_display_lang') : null;
    if (stored && LANGS_ARRAY.includes(stored.toLowerCase())) {
      return stored.toLowerCase();
    }

    const browserLang = typeof navigator !== 'undefined' ? navigator.language : null;
    if (browserLang) {
      const normalized = browserLang.toLowerCase().split(/[-_]/)[0];
      if (LANGS_ARRAY.includes(normalized)) {
        return normalized;
      }
    }

    return DEFAULT_LANG;
  }

  const normalized = code.toLowerCase().split(/[-_]/)[0];
  return LANGS_ARRAY.includes(normalized) ? normalized : DEFAULT_LANG;
}

/**
 * Check if language is supported
 * @param {string} code - Language code
 * @returns {boolean}
 */
export function isSupported(code) {
  if (!code) return false;
  const normalized = code.toLowerCase().split(/[-_]/)[0];
  return LANGS_ARRAY.includes(normalized);
}

/**
 * Get all supported languages
 * @returns {string[]}
 */
export function allSupported() {
  return LANGS_ARRAY.slice();
}

/**
 * Get language display name
 * @param {string} code - Language code
 * @returns {string}
 */
export function getLangName(code) {
  const names = {
    en: 'English',
    ar: 'العربية',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    nl: 'Nederlands',
    it: 'Italiano',
    sv: 'Svenska',
    da: 'Dansk',
    tr: 'Türkçe',
  };
  return names[normLang(code)] || code.toUpperCase();
}
