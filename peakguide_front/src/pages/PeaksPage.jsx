import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchPeaks, fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";
import PeaksToolbar from "../components/PeaksToolbar";
import PeakCard from "../components/PeakCard";
import PeakCardSkeleton from "../components/PeakCardSkeleton";

export default function PeaksPage({ lang }) {
	const [q, setQ] = useState("");
	const [range, setRange] = useState("all");
	const [refreshKey, setRefreshKey] = useState(0);
	const [sort, setSort] = useState("elev_desc"); // elev_desc | elev_asc | name_asc | name_desc

	const [searchParams] = useSearchParams();
	const rangeSlug = searchParams.get("range"); // Range filter from URL

	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang, refreshKey]);
	const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);

	const peaks = useMemo(() => peaksState.data || [], [peaksState.data]);

	const filteredPeaks = useMemo(() => {
		const safeQ = q.trim().toLowerCase();

		let list = Array.isArray(peaks) ? peaks : [];

		// 1) URL range filter (highest priority)
		if (rangeSlug) {
			list = list.filter((p) => p.range_slug === rangeSlug);
		}

		// 2) Toolbar range filter (only if not "all" AND no URL override)
		if (!rangeSlug && range !== "all") {
			list = list.filter((p) => p.range_slug === range);
		}

		// 3) Search
		if (safeQ) {
			list = list.filter((p) => {
				const name = String(p.peak_name || "").toLowerCase();
				const rname = String(p.range_name || "").toLowerCase();
				return name.includes(safeQ) || rname.includes(safeQ);
			});
		}

		// 4) Sort
		const out = [...list];
		if (sort === "elev_desc")
			out.sort((a, b) => (b.elevation_m || 0) - (a.elevation_m || 0));
		if (sort === "elev_asc")
			out.sort((a, b) => (a.elevation_m || 0) - (b.elevation_m || 0));
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
	}, [peaks, rangeSlug, range, q, sort]);

	const isLoading = peaksState.status === "loading";
	const isError = peaksState.status === "error";

	return (
		<div style={page}>
			<div style={toolbarBox}>
				<PeaksToolbar
					q={q}
					setQ={setQ}
					range={range}
					setRange={setRange}
					sort={sort}
					setSort={setSort}
					ranges={rangesState.data || []}
					lang={lang}
					urlRangeSlug={rangeSlug}
				/>

				<div style={rightBox}>
					{rangeSlug && (
						<div style={filterChip}>
							<span style={filterText}>
								Filter: <code>{rangeSlug}</code>
							</span>
							<Link to='/peaks' style={clearLink} title='Clear URL filter'>
								Clear
							</Link>
						</div>
					)}

					<div style={counter}>
						{lang === "pl" ? "Wyniki" : "Results"}:{" "}
						<b>{filteredPeaks.length}</b>
					</div>
				</div>
			</div>

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
	color: "var(--tollbar-text)",
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

const filterChip = {
	display: "inline-flex",
	alignItems: "center",
	gap: 10,
	border: "1px solid var(--border)",
	borderRadius: 999,
	padding: "10px 12px",
	background: "rgba(15,23,42,0.03)",
	boxShadow: "var(--shadow-soft)",
};

const filterText = {
	color: "var(--muted)",
	fontWeight: 900,
	fontSize: 13,
};

const clearLink = {
	textDecoration: "none",
	fontWeight: 1000,
	color: "var(--primary)",
	border: "1px solid rgba(31,122,79,0.30)",
	background: "rgba(31,122,79,0.10)",
	padding: "6px 10px",
	borderRadius: 999,
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
