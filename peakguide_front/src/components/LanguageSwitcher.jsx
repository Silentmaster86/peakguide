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
