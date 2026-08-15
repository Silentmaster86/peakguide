import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SEO } from "../seo/SEO";
import { SITE_URL, SITE_NAME } from "../seo/site";
import { fetchCountries, fetchPeaks, fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";
import PeaksToolbar from "../components/PeaksToolbar";
import PeakCard from "../components/PeakCard";
import PeakCardSkeleton from "../components/PeakCardSkeleton";

export default function PeaksPage({ lang }) {
	const [refreshKey, setRefreshKey] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();

	// URL params (single source of truth)
	const q = searchParams.get("q") || "";
	const country = searchParams.get("country") || "all";
	const region = searchParams.get("region") || "all";
	const range = searchParams.get("range") || "all";
	const sort = searchParams.get("sort") || "elev_desc"; // elev_desc | elev_asc | name_asc | name_desc

	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang, refreshKey]);
	const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);
	const countriesState = useAsync(
		() => fetchCountries({ lang }),
		[lang, refreshKey],
	);

	const peaks = useMemo(
		() => (Array.isArray(peaksState.data) ? peaksState.data : []),
		[peaksState.data],
	);
	const rangesList = useMemo(
		() => (Array.isArray(rangesState.data) ? rangesState.data : []),
		[rangesState.data],
	);
	const countriesList = useMemo(
		() => (Array.isArray(countriesState.data) ? countriesState.data : []),
		[countriesState.data],
	);
	const t = useMemo(() => getLabels(lang), [lang]);

	function updateParam(key, value) {
		const next = new URLSearchParams(searchParams);
		const v = typeof value === "string" ? value : String(value ?? "");

		// normalize empty
		if (key === "q") {
			const trimmed = v.trim();
			if (!trimmed) next.delete("q");
			else next.set("q", trimmed);
		} else if (key === "range") {
			if (!v || v === "all") next.delete("range");
			else next.set("range", v);
		} else if (key === "sort") {
			if (!v || v === "elev_desc") next.delete("sort");
			else next.set("sort", v);
		} else {
			if (!v) next.delete(key);
			else next.set(key, v);
		}

		setSearchParams(next, { replace: true });
	}

	function updateCountry(value) {
		const next = new URLSearchParams(searchParams);
		if (!value || value === "all") next.delete("country");
		else next.set("country", value);
		next.delete("region");
		next.delete("range");
		setSearchParams(next, { replace: true });
	}

	function updateRegion(value) {
		const next = new URLSearchParams(searchParams);
		if (!value || value === "all") next.delete("region");
		else next.set("region", value);
		next.delete("range");
		setSearchParams(next, { replace: true });
	}

	const filteredPeaks = useMemo(() => {
		const safeQ = q.trim().toLowerCase();
		let list = peaks;

		// 1) Location and range filters
		if (country !== "all") {
			list = list.filter((p) => p.country_code === country);
		}

		if (region !== "all") {
			list = list.filter((p) => p.region_slug === region);
		}

		if (range && range !== "all") {
			list = list.filter((p) => p.range_slug === range);
		}

		// 2) Search
		if (safeQ) {
			list = list.filter((p) => {
				const name = String(p.peak_name || "").toLowerCase();
				const rname = String(p.range_name || "").toLowerCase();
				return name.includes(safeQ) || rname.includes(safeQ);
			});
		}

		// 3) Sort
		const out = [...list];

		if (sort === "elev_desc")
			out.sort((a, b) => (b.elevation_m || 0) - (a.elevation_m || 0));
		if (sort === "elev_asc")
			out.sort((a, b) => (a.elevation_m || 0) - (b.elevation_m || 0));

		// Note: locale "pl" is okay even for other langs; if you prefer, swap to lang.
		if (sort === "name_asc")
			out.sort((a, b) =>
				String(a.peak_name || "").localeCompare(
					String(b.peak_name || ""),
						lang,
				),
			);

		if (sort === "name_desc")
			out.sort((a, b) =>
				String(b.peak_name || "").localeCompare(
					String(a.peak_name || ""),
						lang,
				),
			);

		return out;
	}, [peaks, country, region, range, q, sort, lang]);

	const sections = useMemo(() => {
		const kgp = [];
		const polishOther = [];
		const ukThreePeaks = [];
		const other = [];
		for (const p of filteredPeaks) {
			if (p.country_code === "PL" && p.is_korona) kgp.push(p);
			else if (p.country_code === "PL") polishOther.push(p);
			else if (p.country_code === "GB") ukThreePeaks.push(p);
			else other.push(p);
		}

		return [
			{ key: "kgp", title: t.kgp, peaks: kgp },
			{ key: "pl-other", title: t.polishOther, peaks: polishOther },
			{ key: "uk-three-peaks", title: t.ukThreePeaks, peaks: ukThreePeaks },
			{ key: "other", title: t.other, peaks: other },
		].filter((section) => section.peaks.length > 0);
	}, [filteredPeaks, t]);

	const isLoading = peaksState.status === "loading";
	const isError =
		peaksState.status === "error" ||
		rangesState.status === "error" ||
		countriesState.status === "error";

	const canonical = `${SITE_URL}/peaks`;

	const title =
		lang === "pl" ? `Szczyty — ${SITE_NAME}` : `Peaks — ${SITE_NAME}`;

	const description =
		lang === "pl"
			? "Szczyty Polski i Wielkiej Brytanii, w tym Korona Gór Polski oraz UK Three Peaks. Filtruj według kraju, regionu i pasma."
			: "Browse mountain peaks in Poland and the United Kingdom, including the Crown of Polish Mountains and UK Three Peaks.";

	return (
		<div style={page}>
			{/* Helmet SEO */}
			<SEO title={title} description={description} canonical={canonical} />

			{/* Toolbar */}
			<div style={toolbarBox}>
				<PeaksToolbar
					q={q}
					setQ={(val) => updateParam("q", val)}
					country={country}
					setCountry={updateCountry}
					region={region}
					setRegion={updateRegion}
					range={range}
					setRange={(val) => updateParam("range", val)}
					sort={sort}
					setSort={(val) => updateParam("sort", val)}
					ranges={rangesList}
					countries={countriesList}
					lang={lang}
				/>

				<div style={rightBox}>
					<div style={counter}>
						{t.results}:{" "}
						<b>{filteredPeaks.length}</b>
					</div>
				</div>
			</div>

			{/* Error */}
			{isError && (
				<div style={errorBox}>
					<div style={{ fontWeight: 800, marginBottom: 6 }}>
						{lang === "pl"
							? "Nie udało się pobrać danych"
							: "Failed to load data"}
					</div>

					<div style={{ opacity: 0.9, marginBottom: 10 }}>
						{peaksState.error || rangesState.error || countriesState.error}
					</div>

					<button
						type='button'
						style={retryBtn}
						onClick={() => setRefreshKey((x) => x + 1)}
					>
						{lang === "pl" ? "Spróbuj ponownie" : "Retry"}
					</button>
				</div>
			)}

			{/* Grid */}
			{!isError && (
				<>
					{isLoading ? (
						<div style={grid}>
							{Array.from({ length: 10 }).map((_, i) => (
								<PeakCardSkeleton key={`peak-${i}`} />
							))}
						</div>
					) : (
						sections.map((section, index) => (
							<section key={section.key}>
								<div style={{ ...sectionHead, marginTop: index ? 18 : 4 }}>
									<h2 style={sectionTitle}>{section.title}</h2>
									<div style={sectionCount}>{section.peaks.length}</div>
								</div>
								<div style={grid}>
									{section.peaks.map((peak) => (
										<PeakCard key={peak.slug} peak={peak} lang={lang} />
									))}
								</div>
							</section>
						))
					)}
				</>
			)}

			{/* Optional empty state */}
			{!isError && !isLoading && filteredPeaks.length === 0 ? (
				<div style={emptyBox}>
					{lang === "pl"
						? "Brak wyników — spróbuj zmienić filtry."
						: "No results — try changing filters."}
				</div>
			) : null}
		</div>
	);
}

function getLabels(lang) {
	const labels = {
		pl: {
			results: "Wyniki",
			kgp: "Korona Gór Polski",
			polishOther: "Dodatkowe szczyty w Polsce",
			ukThreePeaks: "UK Three Peaks",
			other: "Pozostałe szczyty",
		},
		en: {
			results: "Results",
			kgp: "Crown of Polish Mountains",
			polishOther: "Other peaks in Poland",
			ukThreePeaks: "UK Three Peaks",
			other: "Other peaks",
		},
		ua: {
			results: "Результати",
			kgp: "Корона польських гір",
			polishOther: "Інші вершини Польщі",
			ukThreePeaks: "Три вершини Великої Британії",
			other: "Інші вершини",
		},
		zh: {
			results: "结果",
			kgp: "波兰山峰王冠",
			polishOther: "波兰其他山峰",
			ukThreePeaks: "英国三峰",
			other: "其他山峰",
		},
	};

	return labels[lang] || labels.pl;
}

/* ----------------------------- styles ------------------------------ */

const page = {
	display: "grid",
	gap: 14,
	width: "100%",
	maxWidth: "100%",
	minWidth: 0,
	overflow: "hidden",
};

const toolbarBox = {
	display: 'flex',
	justifyContent: 'space-between',
	gap: 12,
	alignItems: 'flex-end',
	flexWrap: 'wrap',
	width: '100%',
	maxWidth: '100%',
	minWidth: 0,
	overflow: 'hidden',
	border: '1px solid color-mix(in srgb, var(--primary) 12%, var(--border))',
	borderRadius: 18,
	padding: 12,
	background: 'var(--surface)',
	color: 'var(--text)',
	boxShadow: 'var(--shadow-soft)',
};

const rightBox = {
	display: 'flex',
	gap: 10,
	alignItems: "center",
	flexWrap: "wrap",
};

const counter = {
	border: '1px solid color-mix(in srgb, var(--primary) 18%, var(--border))',
	borderRadius: 999,
	marginBottom: 3,
	padding: '8px 12px',
	background: 'var(--pill-bg)',
	color: 'var(--muted)',
	fontSize: 13,
	boxShadow: 'var(--shadow-soft)',
};


const errorBox = {
	border: "1px solid rgba(185,28,28,0.25)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(185,28,28,0.06)",
};

const retryBtn = {
	border: "1px solid rgba(31,122,79,0.30)",
	borderRadius: 12,
	padding: "10px 12px",
	background: "rgba(31,122,79,0.10)",
	color: "var(--primary)",
	cursor: "pointer",
	fontWeight: 900,
};

const grid = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
	gap: 12,
	paddingTop: 8,
	width: '100%',
	minWidth: 0,
};

const emptyBox = {
	border: '1px dashed color-mix(in srgb, var(--primary) 18%, var(--border))',
	borderRadius: 18,
	padding: 14,
	background: 'var(--surface-2)',
	color: 'var(--muted)',
	fontWeight: 900,
};

/*-------KGP + nearby----------*/

const sectionHead = {
	display: 'flex',
	alignItems: 'baseline',
	justifyContent: 'space-between',
	gap: 10,
	marginTop: 4,
	padding: '0 2px',
};

const sectionTitle = {
	margin: 0,
	fontSize: 16,
	letterSpacing: '-0.2px',
	fontWeight: 1000,
	color: 'var(--text)',
};

const sectionCount = {
	color: 'var(--muted)',
	fontWeight: 1000,
	fontSize: 13,
};
