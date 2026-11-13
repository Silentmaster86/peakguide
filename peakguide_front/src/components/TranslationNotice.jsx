export default function TranslationNotice({ contentLang, lang }) {
  if (!contentLang || contentLang === lang) return null;
  const labels = {
    pl: 'Tłumaczenie jeszcze niedostępne. Język treści:',
    en: 'Translation is not available yet. Content language:',
    ua: 'Переклад ще недоступний. Мова вмісту:',
    zh: '暂无翻译。内容语言：',
  };
  return <small style={{ display: 'block', color: 'var(--muted)' }}>{labels[lang] || labels.pl} {contentLang === 'ua' ? 'UK' : contentLang.toUpperCase()}</small>;
}
