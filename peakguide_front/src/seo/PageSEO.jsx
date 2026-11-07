import { SEO, SITE_URL, SITE_NAME } from './SEO';
const titles = {
  pl: { peaks: 'Szczyty', ranges: 'Pasma górskie', home: 'Twój przewodnik po górach', trails: 'Trasy', about: 'O PeakGuide' },
  en: { peaks: 'Peaks', ranges: 'Mountain ranges', home: 'Your mountain guide', trails: 'Trails', about: 'About PeakGuide' },
  ua: { peaks: 'Вершини', ranges: 'Гірські хребти', home: 'Твій путівник по горах', trails: 'Маршрути', about: 'Про PeakGuide' },
  zh: { peaks: '山峰', ranges: '山脉', home: '你的登山指南', trails: '路线', about: '关于 PeakGuide' },
};
const descriptions = {
  pl: 'Odkrywaj szczyty, pasma i trasy. Sprawdzaj dostępne mapy, źródła i informacje praktyczne przed wyjściem w góry.',
  en: 'Explore peaks, mountain ranges and trails. Check available maps, sources and practical information before your hike.',
  ua: 'Відкривайте вершини, хребти й маршрути. Перевіряйте доступні карти, джерела та практичну інформацію перед походом.',
  zh: '探索山峰、山脉及徒步路线。出发前查看可用地图、资料来源和实用信息。',
};
export default function PageSEO({ page, lang = 'pl' }) {
  return <SEO title={`${(titles[lang] || titles.pl)[page]} — ${SITE_NAME}`} description={descriptions[lang] || descriptions.pl} canonical={`${SITE_URL}${page === 'home' ? '/' : `/${page}`}`} />;
}
