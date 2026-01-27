export default function LanguageSwitcher({ lang, setLang }) {
	return (
		<div style={{ display: "flex", gap: 8 }}>
			<button
				onClick={() => setLang("pl")}
				aria-pressed={lang === "pl"}
				style={btn(lang === "pl")}
			>
				PL
			</button>
			<button
				onClick={() => setLang("en")}
				aria-pressed={lang === "en"}
				style={btn(lang === "en")}
			>
				EN
			</button>
			<button
				onClick={() => setLang("ua")}
				aria-pressed={lang === "ua"}
				style={btn(lang === "ua")}
			>
				UA
			</button>
			<button
				onClick={() => setLang("zh")}
				aria-pressed={lang === "zh"}
				style={btn(lang === "zh")}
			>
				ZH
			</button>
		</div>
	);
}

function btn(active) {
	return {
		padding: "8px 10px",
		borderRadius: 10,
		border: "1px solid #2a2a2a",
		background: active ? "#1f1f1f" : "transparent",
		color: "inherit",
		cursor: "pointer",
		fontWeight: 700,
	};
}
