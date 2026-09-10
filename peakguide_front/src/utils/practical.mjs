export function safeUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try { const u = new URL(value); return ['https:', 'http:'].includes(u.protocol) ? u.href : null; } catch { return null; }
}
export function translation(rows, lang) {
  return (Array.isArray(rows) ? rows : []).find(x => x.lang === lang) || {};
}
export function verifiedDate(value, lang) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Intl.DateTimeFormat(({pl:'pl-PL',en:'en-GB',ua:'uk-UA',zh:'zh-CN'})[lang] || 'en-GB', {dateStyle:'medium',timeZone:'UTC'}).format(d);
}
