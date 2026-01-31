import { useMemo } from "react";
import { useDropdown } from "../hooks/useDropdown";
import DropdownMenu from "./DropdownMenu";

const OPTIONS = [
	{ value: "pl", label: "PL", name: "Polski", flag: "🇵🇱" },
	{ value: "en", label: "EN", name: "English", flag: "🇬🇧" },
	{ value: "ua", label: "UA", name: "Українська", flag: "🇺🇦" },
	{ value: "zh", label: "ZH", name: "中文", flag: "🇨🇳" },
];

export default function LanguageSwitcherDropdown({
	lang = "pl", // current lang
	setLang,
	compact = false, // compact mode (show less text)
}) {
	const t = useMemo(() => getLabels(lang), [lang]);
	const { open, setOpen, wrapRef } = useDropdown();

	const current = OPTIONS.find((o) => o.value === lang) || OPTIONS[0];

	const items = OPTIONS.map((o) => ({
		key: o.value, // value to set
		label: o.name, // full name in menu
		badge: o.flag, // flag icon in menu
		sub: o.label, // short label in menu
		active: o.value === lang, // highlight current lang
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
				<span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
					<span aria-hidden='true' style={{ fontSize: 16, lineHeight: 1 }}>
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
				minWidth={220}
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
		pl: { aria: "Język" },
		en: { aria: "Language" },
		ua: { aria: "Мова" },
		zh: { aria: "语言" },
	};
	return dict[lang] || dict.pl;
}

const styles = {
	wrap: { position: "relative" },

	btn: {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		gap: 10,
		height: "var(--nav-pill-h)",
		padding: "0 var(--nav-pill-px)",
		borderRadius: 999,
		border: "1px solid var(--btn-border)",
		fontSize: "var(--nav-pill-fs)",
		background: "var(--btn-bg)",
		color: "var(--text)",
		boxShadow: "var(--shadow-soft)",
		fontWeight: 900,
		cursor: "pointer",
		outline: "none",
	},

	btnText: { fontSize: 13, opacity: 0.9 },
};
