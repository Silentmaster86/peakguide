import { Link } from 'react-router-dom';

function formatDuration(minutes) {
	if (!minutes) return '-';

	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;

	if (hours === 0) {
		return `${remainingMinutes} min`;
	}
	if (remainingMinutes === 0) {
		return `${hours} h`;
	}

	return `${hours} h ${remainingMinutes} min`;
}

const translations = {
	pl: {
		peak: 'Szczyt',
		difficulty: 'Trudność',
		route: 'Trasa',
		gain: 'przewyższenie',
		hard: 'trudna',
		'out-and-back': 'tam i z powrotem',
	},
	en: {
		peak: 'Peak',
		difficulty: 'Difficulty',
		route: 'Route',
		gain: 'elevation gain',
		hard: 'hard',
		'out-and-back': 'out and back',
	},
	ua: {
		peak: 'Вершина',
		difficulty: 'Складність',
		route: 'Маршрут',
		gain: 'набір висоти',
		hard: 'складний',
		'out-and-back': 'туди й назад',
	},
	zh: {
		peak: '山峰',
		difficulty: '难度',
		route: '路线',
		gain: '累计爬升',
		hard: '困难',
		'out-and-back': '往返',
	},
};

export default function TrailCard({ trail, lang }) {
	const t = translations[lang] || translations.en;

	return (
		<Link
			to={`/peaks/${trail.peak_slug}?tab=trails`}
			style={{
				display: 'block',
				textDecoration: 'none',
				color: 'inherit',
				marginBottom: 20,
			}}
		>
			<article
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

				<p style={location}>
					{trail.country_name} · {trail.range_name} ·{' '}
					{trail.region_name}
				</p>

				<p style={peakName}>
					⛰️ {t.peak}: {trail.peak_name}
				</p>

				<div style={meta}>
					<span style={difficultyBadge}>
						{t[trail.difficulty] || trail.difficulty}
					</span>

					<span style={routeText}>
						↔ {t.route}: {t[trail.route_type] || trail.route_type}
					</span>
				</div>

				<div style={stats}>
					<span style={stat}>🥾 {trail.distance_km} km</span>
					<span style={stat}>
						↗️ {trail.elevation_gain_m} m {t.gain}
					</span>
					<span style={stat}>⏱️ {formatDuration(trail.time_min)}</span>
				</div>
			</article>
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
