import { Link } from "react-router-dom";

export default function PeakCard({ peak, lang }) {
	const heightLabel = lang === "pl" ? "Wysokość" : "Elevation";

	return (
		<Link
			to={`/peaks/${peak.slug}`}
			aria-label={`Open details for ${peak.peak_name}`}
			style={{
				textDecoration: "none",
				color: "inherit",
				display: "block",
			}}
		>
			<article
				style={card}
				onMouseEnter={(e) => {
					e.currentTarget.style.transform = "translateY(-2px)";
					e.currentTarget.style.boxShadow = "var(--shadow)";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.transform = "translateY(0px)";
					e.currentTarget.style.boxShadow = "var(--shadow-soft)";
				}}
			>
				<header style={cardTop}>
					<div style={{ minWidth: 0 }}>
						<h3 style={title} title={peak.peak_name}>
							{peak.peak_name}
						</h3>
						<div style={sub}>{peak.range_name}</div>
					</div>

					<div style={badge} title={heightLabel}>
						⛰️ {peak.elevation_m} m
					</div>
				</header>
			</article>
		</Link>
	);
}

const card = {
	display: "flex",
	flexDirection: "column",
	justifyContent: "space-between",

	minHeight: 90,
	height: "100%",
	border: '1px solid color-mix(in srgb, var(--primary) 18%, var(--border))',
	borderRadius: 18,
	padding: 14,
	background: 'color-mix(in srgb, var(--surface-2) 92%, transparent)',
	boxShadow: 'var(--shadow-soft)',
	transition:
		'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
};

const cardTop = {
	display: 'grid',
	gridTemplateColumns: '1fr auto',
	gap: 10,
	alignItems: 'start',
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
