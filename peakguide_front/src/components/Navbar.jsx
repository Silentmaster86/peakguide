import { NavLink, useLocation } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar({ lang = "pl", uiLang, setUiLang }) {
	const t = getLabels(lang);
	const { pathname } = useLocation();
	const isHome = pathname === "/";

	return (
		<nav style={nav} aria-label='Primary'>
			<div style={left}>
				<span style={brandBadge}>⛰️</span>
				<div style={{ lineHeight: 1.1 }}>
					<div style={brandTitle}>PeakGuide</div>
					<div style={brandSub}>{t.tagline}</div>
				</div>
			</div>

			<div style={center}>
				{!isHome && (
					<NavLink to='/' style={navLink}>
						{t.home}
					</NavLink>
				)}

				<NavLink to='/peaks' style={navLink}>
					{t.peaks}
				</NavLink>

				<NavLink to='/ranges' style={navLink}>
					{t.ranges}
				</NavLink>

				<span style={disabledLink} title={t.soonTip}>
					{t.routes}
					<span style={soonPill}>{t.soon}</span>
				</span>

				<span style={disabledLink} title={t.soonTip}>
					{t.trailheads}
					<span style={soonPill}>{t.soon}</span>
				</span>
			</div>

			<div style={right}>
				{/* Keep UI choice (pl/en/ua/zh) even if DB fallback happens */}
				<LanguageSwitcher lang={uiLang} setLang={setUiLang} />
			</div>
		</nav>
	);
}

/* ----------------------------- labels ------------------------------ */

function getLabels(lang) {
	const dict = {
		pl: {
			tagline: "Korona Gór Polski i nie tylko",
			home: "Start",
			peaks: "Szczyty",
			ranges: "Pasma",
			routes: "Trasy",
			trailheads: "Punkty startowe",
			soon: "wkrótce",
			soonTip: "Ta sekcja będzie dostępna wkrótce.",
		},
		en: {
			tagline: "Crown of Polish Mountains & more",
			home: "Home",
			peaks: "Peaks",
			ranges: "Ranges",
			routes: "Routes",
			trailheads: "Trailheads",
			soon: "soon",
			soonTip: "This section is coming soon.",
		},
		ua: {
			tagline: "Корона польських гір і не тільки",
			home: "Головна",
			peaks: "Вершини",
			ranges: "Хребти",
			routes: "Маршрути",
			trailheads: "Стартові точки",
			soon: "скоро",
			soonTip: "Цей розділ скоро буде доступний.",
		},
		zh: {
			tagline: "波兰山冠及更多",
			home: "首页",
			peaks: "山峰",
			ranges: "山脉",
			routes: "路线",
			trailheads: "起点",
			soon: "即将",
			soonTip: "该功能即将上线。",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ------------------------------ */

const nav = {
	display: "grid",
	gridTemplateColumns: "1fr auto 1fr",
	alignItems: "center",
	gap: 12,
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 12,
	background: "var(--surface-2)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const left = {
	display: "flex",
	alignItems: "center",
	gap: 10,
	minWidth: 220,
};

const center = {
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	gap: 10,
	flexWrap: "wrap",
};

const right = {
	display: "flex",
	justifyContent: "flex-end",
};

const brandBadge = {
	width: 34,
	height: 34,
	borderRadius: 12,
	display: "grid",
	placeItems: "center",
	border: "1px solid rgba(31,122,79,0.28)",
	background: "rgba(31,122,79,0.10)",
	fontWeight: 1000,
};

const brandTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.3px",
};

const brandSub = {
	fontSize: 12,
	color: "var(--muted)",
	marginTop: 2,
};

const navLink = ({ isActive }) => ({
	textDecoration: "none",
	fontWeight: 1000,
	padding: "10px 12px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: isActive ? "rgba(31,122,79,0.10)" : "rgba(255,255,255,0.55)",
	color: isActive ? "var(--primary)" : "var(--text)",
	boxShadow: "var(--shadow-soft)",
});

const disabledLink = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: "10px 12px",
	borderRadius: 999,
	border: "1px dashed rgba(15,23,42,0.22)",
	background: "rgba(255,255,255,0.45)",
	color: "var(--muted)",
	fontWeight: 1000,
	cursor: "not-allowed",
	userSelect: "none",
};

const soonPill = {
	fontSize: 11,
	fontWeight: 1000,
	padding: "4px 8px",
	borderRadius: 999,
	border: "1px solid rgba(217,119,6,0.25)",
	background: "rgba(217,119,6,0.10)",
	color: "rgba(217,119,6,0.95)",
};
