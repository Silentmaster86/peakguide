export const localeFor = (lang) => ({ pl: 'pl-PL', en: 'en-GB', ua: 'uk-UA', zh: 'zh-CN' })[lang] || 'pl-PL';
export function countLabel(count, noun, lang = 'pl') {
  const forms = {
    pl: { peaks: { one: 'szczyt', few: 'szczyty', other: 'szczytów' }, ranges: { one: 'pasmo', few: 'pasma', other: 'pasm' } },
    en: { peaks: { one: 'peak', other: 'peaks' }, ranges: { one: 'range', other: 'ranges' } },
    ua: { peaks: { one: 'вершина', few: 'вершини', other: 'вершин' }, ranges: { one: 'хребет', few: 'хребти', other: 'хребтів' } },
    zh: { peaks: { other: '座山峰' }, ranges: { other: '条山脉' } },
  };
  const dict = (forms[lang] || forms.pl)[noun];
  const category = new Intl.PluralRules(localeFor(lang)).select(count);
  return `${count.toLocaleString(localeFor(lang))} ${dict[category] || dict.other}`;
}
export function formatDuration(minutes, lang = 'pl') {
  const total = Number(minutes);
  if (minutes == null || !Number.isFinite(total) || total <= 0) return '—';
  const hours = Math.floor(total / 60), mins = Math.round(total % 60);
  const hourUnit = lang === 'zh' ? '小时' : lang === 'ua' ? 'год' : 'h';
  const minuteUnit = lang === 'zh' ? '分钟' : lang === 'ua' ? 'хв' : 'min';
  return [hours && `${hours} ${hourUnit}`, mins && `${mins} ${minuteUnit}`].filter(Boolean).join(' ');
}
