// Map unsupported content languages to a fallback language for API
function apiLang(lang) {
  if (lang === "ua" || lang === "zh") return "en";
  return lang;
}

export async function fetchPeaks({ lang = "pl" } = {}) {
  const safeLang = apiLang(lang); // Ensure API always gets supported language

  const res = await fetch(`/api/peaks?lang=${encodeURIComponent(safeLang)}`);
  if (!res.ok) throw new Error(`Failed to load peaks (${res.status})`);
  return res.json();
}

export async function fetchRanges({ lang = "pl" } = {}) {
  const safeLang = apiLang(lang); // Ensure API always gets supported language

  const res = await fetch(`/api/ranges?lang=${encodeURIComponent(safeLang)}`);
  if (!res.ok) throw new Error(`Failed to load ranges (${res.status})`);
  return res.json();
}

export async function fetchPeakBySlug(lang, slug) {
  const safeLang = apiLang(lang); // Ensure API always gets supported language

  const res = await fetch(`/api/peaks/${slug}?lang=${encodeURIComponent(safeLang)}`);
  if (!res.ok) throw new Error("Failed to load peak details");
  return res.json();
}
