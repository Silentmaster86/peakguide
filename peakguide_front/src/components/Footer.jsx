import { NavLink } from "react-router-dom";

/**
 * Footer PRO
 * - Lightweight + low contrast
 * - No duplicated "full navigation" feel
 * - No tech stack / dev status / MVP talk
 * - Uses your CSS variables (var(--surface), var(--border), etc.)
 */

export default function Footer({ lang = "pl" }) {
	const t = getLabels(lang);

	return (
		<footer style={wrap} aria-label='Footer'>
			<div style={left}>
				<div style={brandRow}>
					<span style={brandBadge} aria-hidden='true'>
						⛰️
					</span>
					<div style={{ lineHeight: 1.1 }}>
						<div style={brandTitle}>PeakGuide</div>
						<div style={brandSub}>{t.tagline}</div>
					</div>
				</div>

				<div style={metaLine}>
					<span style={metaMuted}>© {new Date().getFullYear()} PeakGuide</span>
					<span style={dot}>•</span>
					<span style={metaMuted}>{t.note}</span>
				</div>
			</div>

			<nav style={right} aria-label='Footer links'>
				<NavLink to='/peaks' style={footLink}>
					{t.peaks}
				</NavLink>
				<NavLink to='/ranges' style={footLink}>
					{t.ranges}
				</NavLink>
				<NavLink to='/about' style={footLink}>
					{t.about}
				</NavLink>
			</nav>
		</footer>
	);
}

/* ----------------------------- labels ------------------------------ */

function getLabels(lang) {
	const dict = {
		pl: {
			tagline: "Korona Gór Polski i nie tylko",
			note: "Praktyczny przewodnik po szczytach",
			peaks: "Szczyty",
			ranges: "Pasma",
			about: "O projekcie",
		},
		en: {
			tagline: "Crown of Polish Mountains & more",
			note: "A practical guide to peaks",
			peaks: "Peaks",
			ranges: "Ranges",
			about: "About",
		},
		ua: {
			tagline: "Корона польських гір і не тільки",
			note: "Практичний путівник по вершинах",
			peaks: "Вершини",
			ranges: "Хребти",
			about: "Про проєкт",
		},
		zh: {
			tagline: "波兰山峰王冠及更多",
			note: "实用的登山指南",
			peaks: "山峰",
			ranges: "山脉",
			about: "关于",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ------------------------------ */

const wrap = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 12,

	// lighter + smaller than your old footer
	marginTop: 16,
	padding: "10px 12px",

	border: "1px solid rgba(15, 23, 42, 0.12)",
	borderRadius: 16,
	background: "rgba(255,255,255,0.60)", // less contrast than 0.88
	boxShadow: "var(--shadow-soft)",
};

const left = { display: "grid", gap: 8, minWidth: 240 };

const right = {
	display: "flex",
	gap: 8,
	flexWrap: "wrap",
	justifyContent: "flex-end",
};

const brandRow = { display: "flex", alignItems: "center", gap: 10 };

const brandBadge = {
	width: 32,
	height: 32,
	borderRadius: 12,
	display: "grid",
	placeItems: "center",
	border: "1px solid rgba(31,122,79,0.18)",
	background: "rgba(31,122,79,0.06)",
	fontWeight: 1100,
};

const brandTitle = { fontWeight: 1100, letterSpacing: "-0.3px" };
const brandSub = { fontSize: 12, opacity: 0.8, marginTop: 2 };

const metaLine = {
	display: "flex",
	alignItems: "center",
	gap: 8,
	flexWrap: "wrap",
};

const dot = { opacity: 0.5 };
const metaMuted = { fontSize: 12, fontWeight: 850, opacity: 0.72 };

const footLink = ({ isActive }) => ({
	textDecoration: "none",
	fontWeight: 950,
	fontSize: 12,
	padding: "8px 10px",
	borderRadius: 999,
	border: "1px solid rgba(15, 23, 42, 0.12)",
	background: isActive ? "rgba(31,122,79,0.08)" : "rgba(255,255,255,0.45)",
	color: "var(--text)",
	boxShadow: "none",
});
