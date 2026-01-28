import { useMemo } from "react";

export default function LanguageSwitcher({ lang, setLang }) {
	const items = useMemo(
		() => [
			{ key: "pl", label: "PL" },
			{ key: "en", label: "EN" },
			{ key: "ua", label: "UA" },
			{ key: "zh", label: "ZH" },
		],
		[],
	);

	return (
		<div style={wrap} role='group' aria-label='Language switcher'>
			{items.map((it) => {
				const active = lang === it.key;
				return (
					<button
						key={it.key}
						type='button'
						onClick={() => setLang(it.key)}
						style={pill(active)}
						aria-pressed={active}
						title={`Switch language to ${it.key.toUpperCase()}`}
					>
						{it.label}
					</button>
				);
			})}
		</div>
	);
}

const wrap = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: 6,
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "rgba(255,255,255,0.55)",
	boxShadow: "var(--shadow-soft)",
};

const pill = (active) => ({
	// Accessible button styling
	border: "1px solid rgba(15,23,42,0.10)",
	borderRadius: 999,
	padding: "8px 10px",
	minWidth: 44,
	cursor: "pointer",
	fontWeight: 1000,
	letterSpacing: "-0.2px",
	background: active ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.70)",
	color: active ? "#fff" : "var(--text)",
	transition:
		"transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
	boxShadow: active ? "var(--shadow-soft)" : "none",
});
