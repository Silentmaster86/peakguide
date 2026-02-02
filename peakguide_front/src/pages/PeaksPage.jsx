import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchPeaks, fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";
import PeaksToolbar from "../components/PeaksToolbar";
import PeakCard from "../components/PeakCard";
import PeakCardSkeleton from "../components/PeakCardSkeleton";

export default function PeaksPage({ lang }) {
	const [refreshKey, setRefreshKey] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();

	// URL params (single source of truth)
	const q = searchParams.get("q") || "";
	const range = searchParams.get("range") || "all";
	const sort = searchParams.get("sort") || "elev_desc"; // elev_desc | elev_asc | name_asc | name_desc

	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang, refreshKey]);
	const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);

	const peaks = useMemo(
		() => (Array.isArray(peaksState.data) ? peaksState.data : []),
		[peaksState.data],
	);
	const rangesList = useMemo(
		() => (Array.isArray(rangesState.data) ? rangesState.data : []),
		[rangesState.data],
	);

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

	const filteredPeaks = useMemo(() => {
		const safeQ = q.trim().toLowerCase();
		let list = peaks;

		// 1) Range filter
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
					"pl",
				),
			);

		if (sort === "name_desc")
			out.sort((a, b) =>
				String(b.peak_name || "").localeCompare(
					String(a.peak_name || ""),
					"pl",
				),
			);

		return out;
	}, [peaks, range, q, sort]);

	const isLoading = peaksState.status === "loading";
	const isError = peaksState.status === "error";

	return (
		<div style={page}>
			{/* Toolbar */}
			<div style={toolbarBox}>
				<PeaksToolbar
					q={q}
					setQ={(val) => updateParam("q", val)}
					range={range}
					setRange={(val) => updateParam("range", val)}
					sort={sort}
					setSort={(val) => updateParam("sort", val)}
					ranges={rangesList}
					lang={lang}
				/>

				<div style={rightBox}>
					<div style={counter}>
						{lang === "pl" ? "Wyniki" : "Results"}:{" "}
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
						{peaksState.error}
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
				<div style={grid}>
					{isLoading
						? Array.from({ length: 10 }).map((_, i) => (
								<PeakCardSkeleton key={i} />
							))
						: filteredPeaks.map((p) => (
								<PeakCard key={p.slug} peak={p} lang={lang} />
							))}
				</div>
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

/* ----------------------------- styles ------------------------------ */

const page = {
	display: "grid",
	gap: 14,
};

const toolbarBox = {
	display: "flex",
	justifyContent: "space-between",
	gap: 12,
	alignItems: "flex-end",
	flexWrap: "wrap",
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 12,
	background: "var(--menu-bg)",
	color: "var(--toolbar-text)",
	boxShadow: "var(--shadow-soft)",
};

const rightBox = {
	display: "flex",
	gap: 10,
	alignItems: "center",
	flexWrap: "wrap",
};

const counter = {
	border: "1px solid var(--border)",
	borderRadius: 999,
	padding: "10px 12px",
	background: "var(--surface)",
	fontSize: 13,
	boxShadow: "var(--shadow-soft)",
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
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
	gap: 12,
	paddingTop: 6,
};

const emptyBox = {
	border: "1px dashed var(--border)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(15,23,42,0.02)",
	color: "var(--muted)",
	fontWeight: 900,
};
