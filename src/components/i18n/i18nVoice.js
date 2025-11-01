// Placeholder for i18n voice functionality

export function normLang(lang) {
  // Normalize language code
  if (!lang) return 'en';
  return lang.toLowerCase().split('-')[0];
}
