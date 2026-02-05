/**
 * PeakGuide API client
 * --------------------
 * Lightweight fetch helpers with in-memory cache.
 * Cache is reset on page refresh.
 *
 * Intended for READ-ONLY endpoints only.
 */

const API_URL = import.meta.env.VITE_API_URL || "";
// If empty -> use relative URLs (dev / local proxy)

/* ------------------------------------------------------------------ */
/* In-memory cache (per session)                                       */
/* ------------------------------------------------------------------ */

const cache = {
	peaks: new Map(), // key: `${lang}:${only}` -> Peak[]
	ranges: new Map(), // key: lang -> Range[]
	peakBySlug: new Map(), // key: `${lang}:${slug}` -> Peak
	trailsBySlug: new Map(), // key: `${lang}:${slug}` -> Trail[]
	poisBySlug: new Map(), // key: `${lang}:${slug}` -> Poi[]
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/**
 * Normalize language used by API.
 * Backend supports: pl / en
 * UI supports: pl / en / ua / zh
 */
function apiLang(lang) {
	const v = (lang || "pl").toLowerCase();
	if (v === "pl" || v === "en" || v === "ua" || v === "zh") return v;
	return "pl";
}

/**
 * Build API URL without double slashes.
 */
function url(path) {
	if (!API_URL) return path;
	return `${API_URL.replace(/\/$/, "")}${path}`;
}

/**
 * Generic GET with basic error handling.
 */
async function apiGet(path) {
	const res = await fetch(url(path));
	if (!res.ok) {
		throw new Error(`API error ${res.status}: ${path}`);
	}
	return res.json();
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function fetchPeaks({ lang = "pl", only = "all" } = {}) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${only}`;

	if (cache.peaks.has(key)) return cache.peaks.get(key);

	const data = await apiGet(
		`/api/peaks?lang=${encodeURIComponent(safeLang)}&only=${encodeURIComponent(only)}`,
	);

	cache.peaks.set(key, data);
	return data;
}

export async function fetchRanges({ lang = "pl" } = {}) {
	const safeLang = apiLang(lang);

	if (cache.ranges.has(safeLang)) {
		return cache.ranges.get(safeLang);
	}

	const data = await apiGet(`/api/ranges?lang=${encodeURIComponent(safeLang)}`);
	cache.ranges.set(safeLang, data);
	return data;
}

export async function fetchNearbyPeaksBySlug(lang, slug, limit = 6) {
	const safeLang = apiLang(lang);

	const json = await apiGet(
		`/api/peaks/${encodeURIComponent(slug)}/nearby?lang=${encodeURIComponent(safeLang)}&limit=${limit}`,
	);

	return Array.isArray(json.items) ? json.items : [];
}

export async function fetchPeakBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.peakBySlug.has(key)) {
		return cache.peakBySlug.get(key);
	}

	const data = await apiGet(
		`/api/peaks/${encodeURIComponent(slug)}?lang=${encodeURIComponent(safeLang)}`,
	);

	cache.peakBySlug.set(key, data);
	return data;
}

export async function fetchPeakTrailsBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.trailsBySlug.has(key)) {
		return cache.trailsBySlug.get(key);
	}

	const data = await apiGet(
		`/api/peaks/${encodeURIComponent(slug)}/trails?lang=${encodeURIComponent(safeLang)}`,
	);

	cache.trailsBySlug.set(key, data);
	return data;
}

export async function fetchPeakPoisBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.poisBySlug.has(key)) {
		return cache.poisBySlug.get(key);
	}

	const data = await apiGet(
		`/api/peaks/${encodeURIComponent(slug)}/pois?lang=${encodeURIComponent(safeLang)}`,
	);

	cache.poisBySlug.set(key, data);
	return data;
}

export async function fetchRangeBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const res = await fetch(
		url(
			`/api/ranges/${encodeURIComponent(slug)}?lang=${encodeURIComponent(safeLang)}`,
		),
	);
	if (!res.ok) throw new Error("Failed to load range details");
	return res.json();
}

/* ------------------------------------------------------------------ */
/* Optional helpers                                                    */
/* ------------------------------------------------------------------ */

/**
 * Clear all cached data.
 * Useful after admin updates or during development.
 */
export function clearApiCache() {
	Object.values(cache).forEach((map) => map.clear());
}
