import { NavLink } from 'react-router-dom';
import { useMedia } from '../hooks/useMedia';

export default function Footer({ lang = 'pl' }) {
	const t = getLabels(lang);
	const isMobile = useMedia('(max-width: 759px)');

	return (
		<footer
			style={{
				...styles.wrap,
				...(isMobile ? styles.wrapMobile : null),
			}}
			aria-label='Footer'
		>
			<div style={styles.left}>
				<div style={styles.brandRow}>
					<span style={styles.brandBadge} aria-hidden='true'>
						⛰️
					</span>

					<div style={styles.brandText}>
						<div style={styles.brandTitle}>PeakGuide</div>
						<div style={styles.brandSub}>{t.tagline}</div>
					</div>
				</div>

				<div style={styles.metaLine}>
					<span>© {new Date().getFullYear()} PeakGuide</span>
					<span style={styles.dot}>•</span>
					<span>{t.note}</span>
				</div>
			</div>

			<nav
				style={{
					...styles.right,
					...(isMobile ? styles.rightMobile : null),
				}}
				aria-label='Footer links'
			>
				<NavLink to='/peaks' style={styles.footLink}>
					{t.peaks}
				</NavLink>

				<NavLink to='/ranges' style={styles.footLink}>
					{t.ranges}
				</NavLink>

				<NavLink to='/about' style={styles.footLink}>
					{t.about}
				</NavLink>
			</nav>
		</footer>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			tagline: 'Korona Gór Polski i nie tylko',
			note: 'Praktyczny przewodnik po szczytach',
			peaks: 'Szczyty',
			ranges: 'Pasma',
			about: 'O projekcie',
		},
		en: {
			tagline: 'Crown of Polish Mountains & more',
			note: 'A practical guide to peaks',
			peaks: 'Peaks',
			ranges: 'Ranges',
			about: 'About',
		},
		ua: {
			tagline: 'Корона польських гір і не тільки',
			note: 'Практичний путівник по вершинах',
			peaks: 'Вершини',
			ranges: 'Хребти',
			about: 'Про проєкт',
		},
		zh: {
			tagline: '波兰山峰王冠及更多',
			note: '实用的登山指南',
			peaks: '山峰',
			ranges: '山脉',
			about: '关于',
		},
	};

	return dict[lang] || dict.pl;
}

const pillBase = {
	textDecoration: 'none',
	fontWeight: 900,
	height: 'var(--nav-pill-h)',
	padding: '0 var(--nav-pill-px)',
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
	wrap: {
		width: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 12,

		backdropFilter: 'blur(14px)',
		WebkitBackdropFilter: 'blur(14px)',

		marginTop: 22,
		padding: 12,

		border: '1px solid var(--border)',
		borderRadius: 18,
		background: 'var(--menu-bg)',
		boxShadow: 'var(--shadow-soft)',
		color: 'var(--text)',
	},

	wrapMobile: {
		flexDirection: 'column',
		alignItems: 'stretch',
		gap: 12,
	},

	left: {
		display: 'grid',
		gap: 8,
		minWidth: 0,
	},

	right: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 'var(--nav-gap)',
		flexWrap: 'wrap',
	},

	rightMobile: {
		justifyContent: 'flex-start',
	},

	brandRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
		minWidth: 0,
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
		maxWidth: 260,
	},

	metaLine: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		flexWrap: 'wrap',
		color: 'var(--muted)',
		fontSize: 12,
		fontWeight: 850,
	},

	dot: {
		opacity: 0.55,
	},

	footLink: ({ isActive }) => ({
		...pillBase,
		...(isActive ? activePill : null),
	}),
};
