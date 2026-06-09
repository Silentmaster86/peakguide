import { useMemo } from 'react';
import { useDropdown } from '../hooks/useDropdown';
import DropdownMenu from './DropdownMenu';

const OPTIONS = [
	{ value: 'pl', label: 'PL', name: 'Polski', flag: '🇵🇱' },
	{ value: 'en', label: 'EN', name: 'English', flag: '🇬🇧' },
	{ value: 'ua', label: 'UA', name: 'Українська', flag: '🇺🇦' },
	{ value: 'zh', label: 'ZH', name: '中文', flag: '🇨🇳' },
];

export default function LanguageSwitcherDropdown({
	lang = 'pl',
	setLang,
	compact = false,
}) {
	const t = useMemo(() => getLabels(lang), [lang]);
	const { open, setOpen, wrapRef } = useDropdown();

	const current = OPTIONS.find((o) => o.value === lang) || OPTIONS[0];

	const items = OPTIONS.map((o) => ({
		key: o.value,
		label: o.name,
		badge: o.flag,
		sub: o.label,
		active: o.value === lang,
	}));

	return (
		<div ref={wrapRef} style={styles.wrap} id='desktop-lang-switcher'>
			<button
				type='button'
				style={styles.btn}
				onClick={() => setOpen((v) => !v)}
				aria-haspopup='listbox'
				aria-expanded={open}
				aria-label={t.aria}
			>
				<span style={styles.btnInner}>
					<span aria-hidden='true' style={styles.flag}>
						{current.flag}
					</span>

					<span style={styles.btnText}>{current.label}</span>

					{!compact ? (
						<span style={{ ...styles.btnText, opacity: 0.8 }}>
							{current.name}
						</span>
					) : null}
				</span>

				<span aria-hidden='true' style={{ opacity: 0.8 }}>
					▾
				</span>
			</button>

			<DropdownMenu
				open={open}
				wrapRef={wrapRef}
				ariaLabel={t.aria}
				minWidth={compact ? 190 : 220}
				items={items}
				onSelect={(it) => {
					setLang(it.key);
					setOpen(false);
				}}
			/>
		</div>
	);
}

function getLabels(lang) {
	const dict = {
		pl: { aria: 'Język' },
		en: { aria: 'Language' },
		ua: { aria: 'Мова' },
		zh: { aria: '语言' },
	};
	return dict[lang] || dict.pl;
}

const styles = {
	wrap: {
		position: 'relative',
		display: 'inline-flex',
		minWidth: 0,
	},

	btn: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
		height: 'var(--nav-pill-h)',
		padding: '0 var(--nav-pill-px)',
		borderRadius: 999,
		border: '1px solid var(--border)',
		fontSize: 'var(--nav-pill-fs)',
		background: 'var(--btn-bg)',
		color: 'var(--text)',
		boxShadow: 'var(--shadow-soft)',
		fontWeight: 900,
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		maxWidth: '100%',
	},

	btnInner: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 6,
		minWidth: 0,
	},

	flag: {
		fontSize: 16,
		lineHeight: 1,
	},

	btnText: {
		fontSize: 'var(--nav-pill-fs)',
		opacity: 0.9,
		lineHeight: 1,
	},
};
