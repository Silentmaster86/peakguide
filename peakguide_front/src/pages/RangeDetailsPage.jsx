import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPeaks, fetchRanges } from "../api/peakguide";
import PeakCard from "../components/PeakCard";

export default function RangeDetailsPage({ lang = "pl" }) {
	const { slug } = useParams();

	const [status, setStatus] = useState("loading"); // loading | success | error
	const [error, setError] = useState(null);

	const [rangeName, setRangeName] = useState(null);
	const [peaks, setPeaks] = useState([]);

	const labels = useMemo(() => getLabels(lang), [lang]);

	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				setStatus("loading");
				setError(null);
				setRangeName(null);
				setPeaks([]);

				// Load ranges (to display a human-readable name)
				const ranges = await fetchRanges({ lang });
				if (!alive) return;

				const found = (ranges || []).find((r) => r.slug === slug);
				setRangeName(found?.name || slug);

				// Load peaks and filter by range slug
				const allPeaks = await fetchPeaks({ lang });
				if (!alive) return;

				const inRange = (allPeaks || [])
					.filter((p) => p.range_slug === slug)
					.sort((a, b) => Number(b.elevation_m) - Number(a.elevation_m)); // Highest first

				setPeaks(inRange);
				setStatus("success");
			} catch (e) {
				if (!alive) return;
				setError(e?.message || "Failed to load range");
				setStatus("error");
			}
		})();

		return () => {
			alive = false;
		};
	}, [lang, slug]);

	const crumbs = (
		<nav style={crumbsStyle} aria-label='Breadcrumb'>
			<Link to='/peaks' style={crumbLink}>
				{labels.peaks}
			</Link>

			<span style={crumbSep}>›</span>

			<Link to='/ranges' style={crumbLink}>
				{labels.ranges}
			</Link>

			<span style={crumbSep}>›</span>

			<span style={crumbCurrent}>{rangeName || slug}</span>
		</nav>
	);

	if (status === "loading") {
		return (
			<div style={wrap}>
				{crumbs}
				<div style={card}>
					<div style={{ fontWeight: 1000 }}>{labels.loading}</div>
				</div>
			</div>
		);
	}

	if (status === "error") {
		return (
			<div style={wrap}>
				{crumbs}
				<div style={card}>
					<div style={{ fontWeight: 1000, marginBottom: 6 }}>Error</div>
					<div style={{ color: "var(--muted)" }}>{error}</div>
					<div style={{ marginTop: 12 }}>
						<Link to='/peaks' style={backLink}>
							← {labels.back}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={wrap}>
			{crumbs}

			<div style={headerCard}>
				<div style={pill}>🏔️ {labels.range}</div>
				<h1 style={title}>{rangeName || slug}</h1>

				<div style={sub}>
					{labels.count}: <b>{peaks.length}</b>
				</div>
			</div>

			{peaks.length === 0 ? (
				<div style={card}>{labels.empty}</div>
			) : (
				<div style={grid}>
					{peaks.map((p) => (
						<Link
							key={p.slug}
							to={`/peaks/${p.slug}`}
							style={{ textDecoration: "none", color: "inherit" }}
						>
							{/* PeakCard doesn't include its own link */}
							<PeakCard peak={p} lang={lang} />
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			peaks: "Szczyty",
			ranges: "Pasma",
			range: "Pasmo",
			back: "Wróć do listy",
			count: "Liczba szczytów",
			empty: "Brak szczytów w tym paśmie.",
			loading: "Ładowanie…",
		},
		en: {
			peaks: "Peaks",
			ranges: "Ranges",
			range: "Range",
			back: "Back to list",
			count: "Peaks count",
			empty: "No peaks in this range.",
			loading: "Loading…",
		},
		ua: {
			peaks: "Вершини",
			ranges: "Хребти",
			range: "Хребет",
			back: "Назад до списку",
			count: "Кількість вершин",
			empty: "У цьому хребті немає вершин.",
			loading: "Завантаження…",
		},
		zh: {
			peaks: "山峰",
			ranges: "山脉",
			range: "山脉",
			back: "返回列表",
			count: "山峰数量",
			empty: "该山脉暂无山峰。",
			loading: "加载中…",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ------------------------------ */

const wrap = { maxWidth: 1140, margin: "0 auto", padding: "8px 0 20px" };

const crumbsStyle = {
	display: "flex",
	alignItems: "center",
	gap: 8,
	marginBottom: 10,
	color: "var(--muted)",
	fontSize: 13,
};

const crumbLink = {
	color: "var(--text)",
	textDecoration: "none",
	fontWeight: 900,
	borderBottom: "1px dashed var(--ink)",
};

const crumbSep = { opacity: 0.6 };
const crumbCurrent = { color: "var(--muted)", fontWeight: 900 };

const headerCard = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const pill = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "rgba(31,122,79,0.08)",
	color: "var(--primary)",
	fontWeight: 900,
	fontSize: 12,
};

const title = { margin: "10px 0 0", fontSize: 30, letterSpacing: "-0.6px" };
const sub = { marginTop: 6, color: "var(--muted)" };

const card = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const grid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
	gap: 12,
};

const backLink = {
	textDecoration: "none",
	fontWeight: 1000,
	color: "var(--text)",
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	padding: "8px 10px",
	borderRadius: 14,
	display: "inline-flex",
};
