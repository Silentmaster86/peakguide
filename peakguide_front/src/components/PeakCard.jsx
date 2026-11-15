import TranslationNotice from './TranslationNotice';
import { Link } from "react-router-dom";

export default function PeakCard({ peak, lang }) {
	const heightLabel = ({ pl: "Wysokość", en: "Elevation", ua: "Висота", zh: "海拔" })[lang] || "Wysokość";

	return (
		<Link
			to={`/peaks/${peak.slug}`}
      aria-label={`${peak.peak_name} — ${peak.range_name || ""}`}
			style={{
				textDecoration: "none",
				color: "inherit",
				display: "block",
			}}
		>
			<article className='catalogue-card'>
				<div style={cardBody}>
					{peak.cover_image_url ? (
						<img
							src={peak.cover_image_url}
							alt={`${peak.peak_name} — ${peak.range_name}`}
							loading='lazy'
							decoding='async'
							style={thumbnail}
						/>
					) : null}

					<header style={cardTop}>
						<div style={{ minWidth: 0 }}>
							<h3 style={title} title={peak.peak_name}>
								{peak.peak_name}
							</h3>
        <TranslationNotice contentLang={peak.content_lang} lang={lang} />
							<div style={sub}>{peak.range_name}</div>
						</div>

						<div style={badge} title={heightLabel}>
							⛰️ {peak.elevation_m} m
						</div>
					</header>
				</div>
			</article>
		</Link>
	);
}

const cardTop = {
	display: 'grid',
	gridTemplateColumns: '1fr auto',
	gap: 10,
	alignItems: 'start',
	flex: '1 1 auto',
	minWidth: 0,
};

const cardBody = {
	display: 'flex',
	alignItems: 'center',
	gap: 12,
	minWidth: 0,
};

const thumbnail = {
	width: 112,
	height: 70,
	flex: '0 0 112px',
	borderRadius: 12,
	border: '1px solid var(--border)',
	objectFit: 'cover',
	objectPosition: 'center',
	background: 'var(--surface-2)',
};

const title = {
	margin: 0,
	fontSize: 16,
	lineHeight: 1.2,
	wordBreak: 'break-word',
};

const sub = {
	color: 'var(--muted)',
	fontSize: 13,
	marginTop: 4,
};

const badge = {
	border: '1px solid color-mix(in srgb, var(--primary) 34%, var(--border))',
	borderRadius: 999,
	padding: '6px 8px',
	fontWeight: 900,
	fontSize: 12,
	whiteSpace: 'nowrap',
	color: 'var(--primary)',
	background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
};
