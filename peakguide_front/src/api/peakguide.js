const API_URL = import.meta.env.VITE_API_URL || "";
// jeśli pusty → lokalny proxy / relative (dev)

function apiLang(lang) {
	if (lang === "ua" || lang === "zh") return "en";
	return lang;
}

function url(path) {
	// zapewnia brak podwójnych slashy
	if (!API_URL) return path;
	return `${API_URL.replace(/\/$/, "")}${path}`;
}

export async function fetchPeaks({ lang = "pl" } = {}) {
	const safeLang = apiLang(lang);
	const res = await fetch(
		url(`/api/peaks?lang=${encodeURIComponent(safeLang)}`),
	);
	if (!res.ok) throw new Error(`Failed to load peaks (${res.status})`);
	return res.json();
}

export async function fetchRanges({ lang = "pl" } = {}) {
	const safeLang = apiLang(lang);
	const res = await fetch(
		url(`/api/ranges?lang=${encodeURIComponent(safeLang)}`),
	);
	if (!res.ok) throw new Error(`Failed to load ranges (${res.status})`);
	return res.json();
}

export async function fetchPeakBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const res = await fetch(
		url(
			`/api/peaks/${encodeURIComponent(slug)}?lang=${encodeURIComponent(safeLang)}`,
		),
	);
	if (!res.ok) throw new Error("Failed to load peak details");
	return res.json();
}
