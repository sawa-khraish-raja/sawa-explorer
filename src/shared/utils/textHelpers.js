export const normalizeText = (text) => {
  if (!text) return '';

  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0600-\u06FF-]/gi, '')
    .toLowerCase();
};

export const capitalize = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const truncate = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
