import { SEO, SITE_URL, SITE_NAME } from './SEO';
const titles = {
  pl: { weather: 'Prognoza pogody', map: 'Mapa szczytów', peaks: 'Szczyty', ranges: 'Pasma górskie', home: 'Twój przewodnik po górach', trails: 'Trasy', about: 'O PeakGuide' },
  en: { weather: 'Weather forecast', map: 'Peak map', peaks: 'Peaks', ranges: 'Mountain ranges', home: 'Your mountain guide', trails: 'Trails', about: 'About PeakGuide' },
  ua: { weather: 'Прогноз погоди', map: 'Мапа вершин', peaks: 'Вершини', ranges: 'Гірські хребти', home: 'Твій путівник по горах', trails: 'Маршрути', about: 'Про PeakGuide' },
  zh: { weather: '天气预报', map: '山峰地图', peaks: '山峰', ranges: '山脉', home: '你的登山指南', trails: '路线', about: '关于 PeakGuide' },
};
const descriptions = {
  pl: 'Odkrywaj szczyty, pasma i trasy. Sprawdzaj dostępne mapy, źródła i informacje praktyczne przed wyjściem w góry.',
  en: 'Explore peaks, mountain ranges and trails. Check available maps, sources and practical information before your hike.',
  ua: 'Відкривайте вершини, хребти й маршрути. Перевіряйте доступні карти, джерела та практичну інформацію перед походом.',
  zh: '探索山峰、山脉及徒步路线。出发前查看可用地图、资料来源和实用信息。',
};
export default function PageSEO({ page, lang = 'pl' }) {
  return <SEO title={`${(titles[lang] || titles.pl)[page]} — ${SITE_NAME}`} description={page === 'weather' ? ({pl:'Prognoza pogody dla szczytów i miejscowości. Temperatura, wiatr, opady oraz wschód i zachód słońca.',en:'Weather forecasts for peaks and towns. Temperature, wind, precipitation, sunrise and sunset.',ua:'Прогноз погоди для вершин і населених пунктів: температура, вітер, опади, схід і захід сонця.',zh:'山峰和城镇天气预报：气温、风速、降水、日出及日落。'})[lang] || descriptions.pl : descriptions[lang] || descriptions.pl} canonical={`${SITE_URL}${page === 'home' ? '/' : `/${page}`}`} />;
}
