const SUPPORTED = ['en', 'hi'];

/** Accepts "hi", "hi-IN,en;q=0.8" etc. Falls back to English. */
function parseLang(input) {
  if (!input || typeof input !== 'string') return 'en';
  const first = input.split(',')[0].trim().toLowerCase().slice(0, 2);
  return SUPPORTED.includes(first) ? first : 'en';
}

/** { en, hi } -> string, falling back to English when a translation is missing. */
function pick(field, lang) {
  if (!field) return '';
  return field[lang] || field.en || '';
}

/** { en: [...], hi: [...] } -> array, falling back to English when the translated list is empty. */
function pickList(field, lang) {
  if (!field) return [];
  const list = field[lang];
  return Array.isArray(list) && list.length ? list : field.en || [];
}

module.exports = { parseLang, pick, pickList, SUPPORTED };
