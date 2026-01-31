import { NavLink, Link, useLocation } from "react-router-dom";
import DesktopThemeSwitcher from "./DesktopThemeSwitcher";
import LanguageSwitcherDropdown from "./LanguageSwitcherDropdown";
import NavDropdown from "./NavDropdown";
import { useMedia } from "../hooks/useMedia";

export default function Navbar({ lang = "pl", uiLang, setUiLang }) {
	const t = getLabels(lang);
	const { pathname } = useLocation();
	const isHome = pathname === "/";

	// Breakpoints
	const isCompact = useMedia("(max-width: 959px)"); // tablet & down
	const isMobile = useMedia("(max-width: 759px)"); // mobile & down

	const homeSections = [
		{ to: "/#why", label: t.why },
		{ to: "/#how", label: t.how },
		{ to: "/#featured", label: t.featured },
		{ to: "/#faq", label: t.faq },
	];

	// What goes into "More"
	const moreItems = [
		...(isHome && (isCompact || isMobile)
			? [
					{ key: "s1", href: "/#why", label: t.why, sub: t.moreHome },
					{ key: "s2", href: "/#how", label: t.how, sub: t.moreHome },
					{ key: "s3", href: "/#featured", label: t.featured, sub: t.moreHome },
					{ key: "s4", href: "/#faq", label: t.faq, sub: t.moreHome },
					{ key: "sep-home", type: "sep" },
				]
			: []),

		{
			key: "routes",
			label: t.routes,
			disabled: true,
			pill: t.soon,
			tip: t.soonTip,
		},
		{
			key: "trailheads",
			label: t.trailheads,
			disabled: true,
			pill: t.soon,
			tip: t.soonTip,
		},
	];

	return (
		<nav id='main-nav' style={styles.nav} aria-label='Primary'>
			<div style={styles.left}>
				<span style={styles.brandBadge}>⛰️</span>
				<div style={{ lineHeight: 1.1 }}>
					<div style={styles.brandTitle}>PeakGuide</div>
					<div style={styles.brandSub}>{t.tagline}</div>
				</div>
			</div>

			<div style={styles.center}>
				{!isHome && (
					<NavLink to='/' style={styles.navLink}>
						{t.home}
					</NavLink>
				)}

				<NavLink to='/peaks' style={styles.navLink}>
					{t.peaks}
				</NavLink>

				<NavLink to='/ranges' style={styles.navLink}>
					{t.ranges}
				</NavLink>

				{/* Desktop: show home sections inline */}
				{isHome && !isCompact && (
					<>
						<span style={styles.sep} aria-hidden='true' />
						{homeSections.map((i) => (
							<Link key={i.to} to={i.to} style={styles.hashLink}>
								{i.label}
							</Link>
						))}
					</>
				)}

				{/* Always: More (on desktop it holds only "soon"; on compact it also holds home sections) */}
				<NavDropdown label={t.more} items={moreItems} />
			</div>

			<div style={styles.right}>
				{/* Desktop-only text, compact shows icons only */}
				<DesktopThemeSwitcher lang={uiLang} compact={isMobile} />
				<LanguageSwitcherDropdown
					lang={uiLang}
					setLang={setUiLang}
					compact={isMobile}
				/>
			</div>
		</nav>
	);
}

/* ---------------- labels ---------------- */

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
			more: "Więcej",

			why: "Dlaczego",
			how: "Jak działa",
			featured: "Polecane",
			faq: "FAQ",
			moreHome: "Sekcja na stronie głównej",
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
			more: "More",

			why: "Why",
			how: "How it works",
			featured: "Featured",
			faq: "FAQ",
			moreHome: "Home section",
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
			more: "Більше",

			why: "Чому",
			how: "Як працює",
			featured: "Вибране",
			faq: "FAQ",
			moreHome: "Розділ головної",
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
			more: "更多",

			why: "为什么",
			how: "如何使用",
			featured: "精选",
			faq: "FAQ",
			moreHome: "主页区块",
		},
	};

	return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

const styles = {
	nav: {
		position: "sticky",
		top: 0,
		zIndex: 100,
		backdropFilter: "blur(12px)",
		WebkitBackdropFilter: "blur(12px)",
		display: "grid",
		gridTemplateColumns: "1fr auto 1fr",
		alignItems: "center",
		gap: 12,
		borderRadius: 18,
		padding: 12,
		background: "var(--btn-bg)",
		boxShadow: "var(--surface)",
		border: "1px solid var(--border)",
		marginBottom: 14,
	},

	left: { display: "flex", alignItems: "center", gap: 10, minWidth: 220 },

	center: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		gap: "var(--nav-gap)",
		flexWrap: "wrap",
		maxWidth: 860,
		overflow: "visible",
		minWidth: 0, // important for text truncation
	},

	right: {
		display: "flex",
		justifyContent: "flex-end",
		gap: 10,
		alignItems: "center",
	},

	brandBadge: {
		width: 34,
		height: 34,
		borderRadius: 12,
		display: "grid",
		placeItems: "center",
		border: "1px solid rgba(31,122,79,0.28)",
		background: "var(--primary)",
		fontWeight: 1000,
	},

	brandTitle: { fontWeight: 1000, letterSpacing: "-0.3px" },
	brandSub: { fontSize: 12, color: "var(--muted)", marginTop: 2 },

	navLink: ({ isActive }) => ({
		textDecoration: "none",
		fontWeight: 1000,
		height: "var(--nav-pill-h)",
		padding: `0 var(--nav-pill-px)`,
		display: "inline-flex",
		alignItems: "center",
		borderRadius: 999,
		border: "1px solid var(--border)",
		fontSize: "var(--nav-pill-fs)",
		background: isActive ? "var(--ink)" : "var(--btn-bg)",
		color: isActive ? "var(--btn-bg)" : "var(--text)",
		boxShadow: "var(--shadow-soft)",
	}),

	hashLink: {
		textDecoration: "none",
		fontWeight: 1000,
		padding: "10px 12px",
		borderRadius: 999,
		border: "1px solid var(--border)",
		background: "rgba(255,255,255,0.55)",
		color: "var(--text)",
		boxShadow: "var(--shadow-soft)",
	},

	sep: {
		width: 1,
		height: 26,
		borderRadius: 99,
		background: "rgba(15,23,42,0.14)",
		margin: "0 2px",
	},
};
