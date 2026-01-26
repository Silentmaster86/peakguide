import { useEffect, useState } from "react";
import PeaksPage from "./pages/PeaksPage";
import LanguageSwitcher from "./components/LanguageSwitcher";

export default function App() {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem("peakguide_lang") || "pl";
  });

  useEffect(() => {
    const titles = {
    pl: "Korona Gór Polski i nie tylko — Przewodnik",
    en: "Crown of Poland's Mountains & more — PeakGuide",
  };
  document.title = titles[lang] || titles.pl;
  document.documentElement.lang = lang === "pl" ? "pl" : "en";
  localStorage.setItem("peakguide_lang", lang);
  }, [lang]);

  return (
    <div style={layout}>
      <div style={page}>
      <header style={header}>
        <div>
            <div style={brandRow}>
              <span style={brandBadge}>{lang === "pl" ? "Przewodnik" : "Guide"}</span>
            </div>

            <h1 style={{ margin: 0 }}>
              {lang === "pl" ? "Korona Gór Polski i nie tylko" : "Crown of Polish Mountains & more"}
            </h1>
            <div style={subtitle}>
              {lang === "pl"
                ? "Szczyty • pasma • trasy i punkty startowe (wkrótce)"
                : "Peaks • ranges • routes and trailheads (soon)"}
            </div>
        </div>

        <LanguageSwitcher lang={lang} setLang={setLang} />
      </header>

      <main style={main}>
        <PeaksPage lang={lang} />
      </main>

      <footer style={footer}>
        <span style={{ opacity: 0.7 }}>
          API: <code>/api/peaks?lang={lang}</code>
        </span>
      </footer>
      </div>
    </div>
  );
}

const page = {
  maxWidth: 1140,
  margin: "0 auto",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 22,
  padding: 18,
  boxShadow: "var(--shadow)",
};


const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 14,
  background: "var(--surface-2)",
  boxShadow: "var(--shadow-soft)",
};

const brandRow = { marginBottom: 6 };

const brandBadge = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid var(--border)",
  background: "rgba(31,122,79,0.08)",
  color: "var(--primary)",
  fontWeight: 800,
  fontSize: 12,
};

const subtitle = { marginTop: 6, color: "var(--muted)", fontSize: 13 };


const layout = {
  minHeight: "100vh",
  padding: 18,
  background:
    "radial-gradient(1100px 520px at 20% 0%, rgba(31,122,79,0.18), transparent 60%), radial-gradient(900px 500px at 90% 10%, rgba(217,119,6,0.14), transparent 55%), var(--bg)",
  color: "var(--text)",
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
};

const main = {
  maxWidth: 1040,
  margin: "0 auto",
  width: "100%",
  padding: "10px 0 32px",
};

const footer = {
  marginTop: 12,
  fontSize: 12,
  textAlign: "center",
  color: "var(--muted)",
};

