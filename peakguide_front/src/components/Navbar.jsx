import { Link, NavLink, useLocation } from 'react-router-dom';
import DesktopThemeSwitcher from './DesktopThemeSwitcher';
import LanguageSwitcherDropdown from './LanguageSwitcherDropdown';
import NavDropdown from './NavDropdown';
import { useMedia } from '../hooks/useMedia';
import { useAuth } from '../auth/AuthContext';

export default function Navbar({ lang = 'pl', uiLang, setUiLang }) {
	const t = getLabels(lang);
	const { pathname } = useLocation();
	const isHome = pathname === '/';

	const isTablet = useMedia('(max-width: 999px)');
	const isMobile = useMedia('(max-width: 699px)');
	const isTiny = useMedia('(max-width: 400px)');

	const { status, logout } = useAuth();
	const authed = status === 'authed';
	const busy = status === 'loading';

	const moreItems = [
		...(isTablet
			? [
					{ key: 'peaks', href: '/peaks', label: t.peaks },
					{ key: 'ranges', href: '/ranges', label: t.ranges },
					{ key: 'sep-main', type: 'sep' },
				]
			: []),

		...(isHome
			? [
					{ key: 's1', href: '/#why', label: t.why, sub: t.moreHome },
					{ key: 's2', href: '/#how', label: t.how, sub: t.moreHome },
					{ key: 's3', href: '/#featured', label: t.featured, sub: t.moreHome },
					{ key: 's4', href: '/#faq', label: t.faq, sub: t.moreHome },
					{ key: 'sep-home', type: 'sep' },
				]
			: []),

		{
			key: 'routes',
			label: t.routes,
			disabled: true,
			pill: t.soon,
			tip: t.soonTip,
		},
		{
			key: 'trailheads',
			label: t.trailheads,
			disabled: true,
			pill: t.soon,
			tip: t.soonTip,
		},
	];

	return (
		<nav
			id='main-nav'
			aria-label='Primary'
			style={{
				...styles.nav,
				...(isMobile ? styles.navMobile : null),
				...(isMobile
					? {
							gridTemplateAreas: isTiny
								? `
							"left left"
							"right center"
							"lang lang"
						`
								: `
							"left left"
							"right center"
						`,
						}
					: null),
				...(isMobile ? styles.navNotSticky : null),
			}}
		>
			<div
				style={{
					...styles.left,
					gridArea: isMobile ? 'left' : undefined,
				}}
			>
				<NavLink to='/' style={styles.homeLink}>
					<span style={styles.brandBadge}>⛰️</span>

						<div style={styles.brandText}>
							<div style={styles.brandTitle}>PeakGuide</div>
							<div style={styles.brandSub}>{t.tagline}</div>
						</div>
				</NavLink>
			</div>

			<div
				style={{
					...styles.right,
					gridArea: isMobile ? 'right' : undefined,
				}}
			>
				{busy ? (
					<span style={styles.authPillMuted}>
						{isMobile ? '⏳' : t.sessionLoading}
					</span>
				) : authed ? (
					<>
						<NavLink to='/panel' style={styles.authLink}>
							{isMobile ? '👤' : t.panel}
						</NavLink>

						<button type='button' onClick={logout} style={styles.logoutBtn}>
							{isMobile ? '⎋' : t.logout}
						</button>
					</>
				) : (
					<NavLink to='/login' style={styles.authLink}>
						{isMobile ? '🔐' : t.login}
					</NavLink>
				)}

				<DesktopThemeSwitcher lang={uiLang} compact={isTablet} />

				{!isTiny && (
					<LanguageSwitcherDropdown
						lang={uiLang}
						setLang={setUiLang}
						compact={isTablet}
					/>
				)}
			</div>
			{isTiny && (
				<div style={styles.langRow}>
					{[
						{ value: 'pl', label: 'PL' },
						{ value: 'en', label: 'EN' },
						{ value: 'ua', label: 'UA' },
						{ value: 'zh', label: 'ZH' },
					].map((item) => (
						<button
							key={item.value}
							type='button'
							onClick={() => setUiLang(item.value)}
							style={{
								...styles.langBtn,
								...(uiLang === item.value ? styles.langBtnActive : null),
							}}
						>
							{item.label}
						</button>
					))}
				</div>
			)}
			<div
				style={{
					...styles.center,
					gridArea: isMobile ? 'center' : undefined,
					...(isMobile ? styles.centerMobile : null),
				}}
			>
				{!isTablet && (
					<>
						<NavLink to='/peaks' style={styles.navLink}>
							{t.peaks}
						</NavLink>

						<NavLink to='/ranges' style={styles.navLink}>
							{t.ranges}
						</NavLink>
					</>
				)}

				<NavDropdown label={t.more} items={moreItems} />
			</div>
		</nav>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			tagline: 'Korona Gór Polski i nie tylko',
			peaks: 'Szczyty',
			ranges: 'Pasma',
			routes: 'Trasy',
			trailheads: 'Punkty startowe',
			soon: 'wkrótce',
			soonTip: 'Ta sekcja będzie dostępna wkrótce.',
			more: 'Więcej',
			why: 'Dlaczego',
			how: 'Jak działa',
			featured: 'Polecane',
			faq: 'FAQ',
			moreHome: 'Sekcja na stronie głównej',
			login: 'Zaloguj',
			logout: 'Wyloguj',
			panel: 'Panel',
			sessionLoading: 'Ładowanie sesji...',
		},
		en: {
			tagline: 'Crown of Polish Mountains & more',
			peaks: 'Peaks',
			ranges: 'Ranges',
			routes: 'Routes',
			trailheads: 'Trailheads',
			soon: 'soon',
			soonTip: 'This section is coming soon.',
			more: 'More',
			why: 'Why',
			how: 'How it works',
			featured: 'Featured',
			faq: 'FAQ',
			moreHome: 'Home section',
			login: 'Login',
			logout: 'Logout',
			panel: 'Panel',
			sessionLoading: 'Loading session...',
		},
		ua: {
			tagline: 'Корона польських гір і не тільки',
			peaks: 'Вершини',
			ranges: 'Хребти',
			routes: 'Маршрути',
			trailheads: 'Стартові точки',
			soon: 'скоро',
			soonTip: 'Цей розділ скоро буде доступний.',
			more: 'Більше',
			why: 'Чому',
			how: 'Як працює',
			featured: 'Вибране',
			faq: 'FAQ',
			moreHome: 'Розділ головної',
			login: 'Увійти',
			logout: 'Вийти',
			panel: 'Панель',
			sessionLoading: 'Завантаження сесії…',
		},
		zh: {
			tagline: '波兰山冠及更多',
			peaks: '山峰',
			ranges: '山脉',
			routes: '路线',
			trailheads: '起点',
			soon: '即将',
			soonTip: '该功能即将上线。',
			more: '更多',
			why: '为什么',
			how: '如何使用',
			featured: '精选',
			faq: 'FAQ',
			moreHome: '主页区块',
			login: '登录',
			logout: '退出',
			panel: '面板',
			sessionLoading: '正在加载会话…',
		},
	};

	return dict[lang] || dict.pl;
}

const pillBase = {
	textDecoration: 'none',
	fontWeight: 850,
	height: 'var(--nav-pill-h)',
	padding: `0 var(--nav-pill-px)`,
	display: 'inline-flex',
	alignItems: 'center',
	justifyContent: 'center',
	borderRadius: 999,
	border: '1px solid var(--border)',
	fontSize: 'var(--nav-pill-fs)',
	background: 'var(--btn-bg)',
	color: 'var(--text)',
	boxShadow: 'var(--shadow-soft)',
	whiteSpace: 'nowrap',
	lineHeight: 1,
};

const activePill = {
	background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
	border: '1px solid color-mix(in srgb, var(--primary) 45%, var(--border))',
	color: 'var(--text)',
};

const styles = {
	nav: {
		position: 'sticky',
		top: 0,
		zIndex: 100,
		backdropFilter: 'blur(14px)',
		WebkitBackdropFilter: 'blur(14px)',
		display: 'grid',
		gridTemplateColumns: '1fr auto auto',
		alignItems: 'center',
		gap: 12,
		borderRadius: 16,
		padding: 12,
		background: 'var(--menu-bg)',
		boxShadow: 'var(--shadow-soft)',
		border: '1px solid rgba(15, 23, 42, 0.12)',
		marginBottom: 18,
	},

	navMobile: {
		display: 'grid',
		gridTemplateColumns: '1fr auto',
		gap: 8,
		padding: 12,
		alignItems: 'center',
		width: '100%',
	},

	left: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		minWidth: 0,
		overflow: 'hidden',
	},

	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 'var(--nav-gap)',
		flexWrap: 'wrap',
		overflow: 'visible',
		minWidth: 0,
	},

	centerMobile: {
		display: 'flex',
		justifyContent: 'flex-end',
		flexWrap: 'nowrap',
		overflowX: 'auto',
		WebkitOverflowScrolling: 'touch',
		paddingTop: 6,
		paddingBottom: 2,
		width: '100%',
		scrollbarWidth: 'none',
		overflow: 'visible',
	},

	right: {
		display: 'flex',
		justifyContent: 'flex-start',
		gap: 6,
		alignItems: 'center',
		flexWrap: 'wrap',
		minWidth: 0,
		width: '100%',
	},

	homeLink: {
		textDecoration: 'none',
		fontWeight: 700,
		color: 'var(--text)',
		height: '100%',
		display: 'inline-flex',
		alignItems: 'center',
		minWidth: 0,
		maxWidth: '100%',
		overflow: 'hidden',
	},

	brandBadge: {
		width: 40,
		height: 40,
		borderRadius: 12,
		display: 'grid',
		placeItems: 'center',
		border: '1px solid color-mix(in srgb, var(--primary) 35%, var(--border))',
		background: 'var(--primary)',
		fontWeight: 1000,
		flex: '0 0 auto',
		boxShadow: 'var(--shadow-soft)',
	},

	brandText: {
		marginLeft: 8,
		minWidth: 0,
		overflow: 'hidden',
	},

	brandTitle: {
		fontWeight: 1000,
		letterSpacing: '-0.3px',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},

	brandSub: {
		fontSize: 12,
		color: 'var(--muted)',
		marginTop: 2,
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		maxWidth: 350,
	},

	navLink: ({ isActive }) => ({
		...pillBase,
		...(isActive ? activePill : null),
	}),

	hashLink: {
		...pillBase,
		background: 'var(--btn-bg)',
	},

	sep: {
		width: 1,
		height: 26,
		borderRadius: 99,
		background: 'var(--border)',
		margin: '0 2px',
	},

	authLink: ({ isActive }) => ({
		...pillBase,
		fontWeight: 900,
		...(isActive ? activePill : null),
	}),

	logoutBtn: {
		...pillBase,
		fontWeight: 900,
		cursor: 'pointer',
	},

	authPillMuted: {
		...pillBase,
		color: 'var(--muted)',
		background: 'var(--surface-2)',
	},

	langRow: {
		gridArea: 'lang',
		display: 'flex',
		gap: 6,
		alignItems: 'center',
		justifyContent: 'flex-start',
		flexWrap: 'wrap',
		paddingTop: 4,
	},

	langBtn: {
		...pillBase,
		height: 28,
		padding: '0 10px',
		fontSize: 11,
		fontWeight: 900,
		cursor: 'pointer',
	},

	langBtnActive: {
		...activePill,
	},

	navNotSticky: {
		position: 'relative',
	},
};
