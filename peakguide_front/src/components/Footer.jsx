import { Link } from "react-router-dom";

export default function Footer({ lang = "pl" }) {
	const t = getLabels(lang);

	return (
		<footer style={wrap}>
			<div style={row}>
				<div style={left}>
					<div style={brand}>⛰️ PeakGuide</div>
					<div style={muted}>
						{t.madeFor} • <span style={{ fontWeight: 900 }}>{t.note}</span>
					</div>
				</div>

				<div style={right}>
					<Link to='/peaks' style={link}>
						{t.peaks}
					</Link>
					<Link to='/ranges' style={link}>
						{t.ranges}
					</Link>

					<span style={disabled} title={t.soonTip}>
						{t.routes}
					</span>
					<span style={disabled} title={t.soonTip}>
						{t.trailheads}
					</span>
				</div>
			</div>
		</footer>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			peaks: "Szczyty",
			ranges: "Pasma",
			routes: "Trasy",
			trailheads: "Punkty startowe",
			soonTip: "Wkrótce.",
			madeFor: "Projekt portfolio",
			note: "MVP",
		},
		en: {
			peaks: "Peaks",
			ranges: "Ranges",
			routes: "Routes",
			trailheads: "Trailheads",
			soonTip: "Coming soon.",
			madeFor: "Portfolio project",
			note: "MVP",
		},
		ua: {
			peaks: "Вершини",
			ranges: "Хребти",
			routes: "Маршрути",
			trailheads: "Стартові точки",
			soonTip: "Скоро.",
			madeFor: "Портфоліо-проєкт",
			note: "MVP",
		},
		zh: {
			peaks: "山峰",
			ranges: "山脉",
			routes: "路线",
			trailheads: "起点",
			soonTip: "即将上线。",
			madeFor: "作品集项目",
			note: "MVP",
		},
	};

	return dict[lang] || dict.pl;
}

/* Styles */
const wrap = {
	marginTop: 16,
	borderTop: "1px solid var(--border)",
	paddingTop: 14,
};

const row = {
	display: "flex",
	justifyContent: "space-between",
	gap: 12,
	alignItems: "flex-start",
	flexWrap: "wrap",
};

const left = { minWidth: 220 };
const brand = { fontWeight: 1000, letterSpacing: "-0.2px" };

const right = {
	display: "flex",
	gap: 10,
	alignItems: "center",
	flexWrap: "wrap",
	justifyContent: "flex-end",
};

const muted = { color: "var(--muted)", fontSize: 12 };

const link = {
	textDecoration: "none",
	fontWeight: 1000,
	padding: "8px 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "rgba(255,255,255,0.55)",
	color: "var(--text)",
	boxShadow: "var(--shadow-soft)",
};

const disabled = {
	padding: "8px 10px",
	borderRadius: 999,
	border: "1px dashed rgba(15,23,42,0.22)",
	background: "rgba(255,255,255,0.45)",
	color: "var(--muted)",
	fontWeight: 1000,
	cursor: "not-allowed",
};
