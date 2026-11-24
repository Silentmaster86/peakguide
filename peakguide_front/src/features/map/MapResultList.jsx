import { Link } from 'react-router-dom';
import TranslationNotice from '../../components/TranslationNotice';
import { parseCoordinates } from '../../utils/coordinates';
import { formatDuration, localeFor } from '../../utils/format';
import { mapLabels, poiKind, symbol } from './presentation';

const copy = {
  pl: { elevation: 'Wysokość', missing: 'Brak lokalizacji na mapie', gain: 'suma podejść' },
  en: { elevation: 'Elevation', missing: 'Map location unavailable', gain: 'elevation gain' },
  ua: { elevation: 'Висота', missing: 'Розташування на мапі недоступне', gain: 'набір висоти' },
  zh: { elevation: '海拔', missing: '暂无地图位置', gain: '累计爬升' },
};

export default function MapResultList({ items, kind = 'peak', lang = 'pl', label }) {
  const t = copy[lang] || copy.pl;
  const ui = mapLabels(lang);
  const number = value => Number(value).toLocaleString(localeFor(lang));
  const present = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));

  return <ul className="explore-map-list pg-map-results" aria-label={label}>
    {items.map(item => {
      const type = kind === 'poi' ? poiKind(item) : kind === 'trail' ? 'route' : 'peak';
      const name = kind === 'peak' ? item.peak_name : item.name;
      const href = kind === 'peak' ? `/peaks/${item.slug}` : kind === 'poi'
        ? `/peaks/${item.peak_slug}?tab=pois`
        : `/peaks/${item.peak_slug}?tab=trails&trail=${encodeURIComponent(item.slug)}`;
      const location = [item.range_name, item.country_name].filter(Boolean).join(' · ');
      return <li key={item.id ?? item.slug}>
        <article className="catalogue-card pg-map-result">
          <div className="pg-map-result-heading">
            <span className={`pg-map-result-symbol pg-legend-symbol--${type}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: symbol(type) }} />
            <div>
              <span className="pg-map-result-kind">{ui[type]}</span>
              <h3><Link to={href}>{name}</Link></h3>
            </div>
            {kind === 'peak' && present(item.elevation_m) && <span className="pg-map-result-altitude" aria-label={`${t.elevation}: ${number(item.elevation_m)} m`}>{number(item.elevation_m)} m</span>}
          </div>
          <TranslationNotice contentLang={item.content_lang} lang={lang} />
          {location && <p className="pg-map-result-location">{location}</p>}
          {kind === 'peak' && item.short_description && <p className="pg-map-result-description">{item.short_description}</p>}
          {kind === 'trail' && <div className="pg-map-result-stats">
            {present(item.distance_km) && <span>{number(item.distance_km)} km</span>}
            {present(item.time_min) && Number(item.time_min) > 0 && <span>{formatDuration(item.time_min, lang)}</span>}
            {present(item.elevation_gain_m) && <span>↗ {number(item.elevation_gain_m)} m {t.gain}</span>}
          </div>}
          {kind === 'peak' && !parseCoordinates(item.latitude, item.longitude) && <p className="pg-map-result-missing">{t.missing}</p>}
        </article>
      </li>;
    })}
  </ul>;
}
