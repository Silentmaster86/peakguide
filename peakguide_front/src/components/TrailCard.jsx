import { formatDuration } from '../utils/format';
import TranslationNotice from './TranslationNotice';
import { Link } from 'react-router-dom';

const translations = {
  pl: {
    peak: 'Szczyt',
    difficulty: 'Trudność',
    route: 'Trasa',
    gain: 'suma podejść',
    hard: 'trudna',
    moderate: 'średnia',
    easy: 'łatwa',
    'out-and-back': 'tam i z powrotem',
    loop: 'pętla',
    'point-to-point': 'z punktu A do B',
  },
  en: {
    peak: 'Peak',
    difficulty: 'Difficulty',
    route: 'Route',
    gain: 'elevation gain',
    hard: 'hard',
    moderate: 'moderate',
    easy: 'easy',
    'out-and-back': 'out and back',
    loop: 'loop',
    'point-to-point': 'point to point',
  },
  ua: {
    peak: 'Вершина',
    difficulty: 'Складність',
    route: 'Маршрут',
    gain: 'набір висоти',
    hard: 'складний',
    moderate: 'середній',
    easy: 'легкий',
    'out-and-back': 'туди й назад',
    loop: 'кільцевий',
    'point-to-point': 'з точки A до точки B',
  },
  zh: {
    peak: '山峰',
    difficulty: '难度',
    route: '路线',
    gain: '累计爬升',
    hard: '困难',
    moderate: '中等',
    easy: '简单',
    'out-and-back': '往返',
    loop: '环线',
    'point-to-point': '点到点',
  },
};

export default function TrailCard({ trail, lang }) {
	const t = translations[lang] || translations.en;

	return (
    <Link
      to={`/peaks/${trail.peak_slug}?tab=trails&trail=${encodeURIComponent(trail.slug)}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        marginBottom: 20,
      }}
    >
      <div
        style={card}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
        }}
      >
        <h2 style={title}>{trail.name}</h2>
        <TranslationNotice contentLang={trail.content_lang} lang={lang} />

        <p style={location}>
          {trail.country_name} · {trail.range_name} · {trail.region_name}
        </p>

        <p style={peakName}>
          ⛰️ {t.peak}: {trail.peak_name}
        </p>

        <div style={meta}>
          <span style={difficultyBadge}>{t[trail.difficulty] || trail.difficulty}</span>

          <span style={routeText}>
            ↔ {t.route}: {t[trail.route_type] || trail.route_type}
          </span>
        </div>

        {(trail.distance_km != null ||
          trail.elevation_gain_m != null ||
          trail.time_min != null) && (
          <div style={stats}>
            {trail.distance_km != null && <span style={stat}>🥾 {trail.distance_km} km</span>}

            {trail.elevation_gain_m != null && (
              <span style={stat}>
                ↗️ {trail.elevation_gain_m} m {t.gain}
              </span>
            )}

            {trail.time_min != null && (
              <span style={stat}>⏱️ {formatDuration(trail.time_min, lang)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

const card = {
	display: 'flex',
	flexDirection: 'column',
	gap: 12,

	height: '100%',
	border: '1px solid color-mix(in srgb, var(--primary) 18%, var(--border))',
	borderRadius: 18,
	padding: 16,
	background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)',
	boxShadow: 'var(--shadow-soft)',
	transition:
		'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
};

const title = {
	margin: 0,
	fontSize: 17,
	lineHeight: 1.25,
	wordBreak: 'break-word',
};

const location = {
	color: 'var(--muted)',
	fontSize: 13,
	margin: 0,
};

const peakName = {
	fontWeight: 700,
	margin: 0,
};

const stats = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: 8,
	marginTop: 2,
};

const stat = {
	border: '1px solid var(--border)',
	borderRadius: 999,
	padding: '6px 9px',
	fontSize: 12,
	fontWeight: 700,
	background: 'var(--pill-bg)',
};

const meta = {
	display: 'flex',
	alignItems: 'center',
	flexWrap: 'wrap',
	gap: 10,
};

const difficultyBadge = {
	border: '1px solid color-mix(in srgb, var(--primary) 34%, var(--border))',
	borderRadius: 999,
	padding: '6px 9px',
	fontSize: 12,
	fontWeight: 900,
	color: 'var(--primary)',
	background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
};

const routeText = {
	color: 'var(--muted)',
	fontSize: 13,
	fontWeight: 600,
};
