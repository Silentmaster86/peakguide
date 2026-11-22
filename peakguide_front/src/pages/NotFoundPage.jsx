import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SEO, SITE_NAME } from '../seo/SEO';

const copy = {
  pl: {
    page: 'Nie znaleziono strony', peak: 'Nie znaleziono szczytu', range: 'Nie znaleziono pasma',
    description: 'Sprawdź adres lub przejdź do katalogu, aby znaleźć szczyt, pasmo albo trasę.',
    peaks: 'Przeglądaj szczyty', ranges: 'Przeglądaj pasma', home: 'Strona główna',
  },
  en: {
    page: 'Page not found', peak: 'Peak not found', range: 'Range not found',
    description: 'Check the address or browse the catalogue to find a peak, mountain range or trail.',
    peaks: 'Browse peaks', ranges: 'Browse ranges', home: 'Home',
  },
  ua: {
    page: 'Сторінку не знайдено', peak: 'Вершину не знайдено', range: 'Хребет не знайдено',
    description: 'Перевірте адресу або відкрийте каталог, щоб знайти вершину, хребет чи маршрут.',
    peaks: 'Переглянути вершини', ranges: 'Переглянути хребти', home: 'Головна',
  },
  zh: {
    page: '未找到页面', peak: '未找到该山峰', range: '未找到山脉',
    description: '请检查网址，或浏览目录以查找山峰、山脉及路线。',
    peaks: '浏览山峰', ranges: '浏览山脉', home: '首页',
  },
};
const linkStyle = {
  display: 'inline-flex', alignItems: 'center', minHeight: 44, padding: '10px 14px',
  border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)',
  background: 'var(--btn-bg)', lineHeight: 1.5,
};

export default function NotFoundPage({ lang = 'pl', kind = 'page' }) {
  const labels = copy[lang] || copy.pl;
  const title = labels[kind] || labels.page;
  const collection = kind === 'range' ? 'ranges' : 'peaks';
  return (
    <section style={{maxWidth: 720, margin: '24px auto', padding: 24, border: '1px solid var(--border)', borderRadius: 18, background: 'var(--surface)', color: 'var(--text)'}}>
      <SEO title={`404 — ${title} — ${SITE_NAME}`} description={labels.description} />
      <Helmet><meta name='robots' content='noindex,follow' /></Helmet>
      <p style={{fontWeight: 700, color: 'var(--muted)'}}>404</p>
      <h1 style={{fontSize: 'clamp(26px, 5vw, 36px)', lineHeight: 1.2}}>{title}</h1>
      <p style={{lineHeight: 1.7}}>{labels.description}</p>
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 20}}>
        <Link to={`/${collection}`} style={linkStyle}>{labels[collection]}</Link>
        <Link to='/' style={linkStyle}>{labels.home}</Link>
      </div>
    </section>
  );
}
