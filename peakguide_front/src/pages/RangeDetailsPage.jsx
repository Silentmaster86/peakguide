import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchRangeBySlug } from "../api/peakguide";
import PeakCard from "../components/PeakCard";
import PeakCardSkeleton from "../components/PeakCardSkeleton";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function RangeDetailsPage({ lang = "pl" }) {
	const { slug } = useParams();
	const isMobile = useMediaQuery("(max-width: 900px)");

	const [status, setStatus] = useState("loading"); // loading | success | error
	const [error, setError] = useState(null);
	const [range, setRange] = useState(null);

	const labels = useMemo(() => getLabels(lang), [lang]);

	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				setStatus("loading");
				setError(null);
				setRange(null);

				const data = await fetchRangeBySlug(lang, slug);
				if (!alive) return;

				setRange(data);
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

	const peaks = useMemo(() => {
		const list = range?.peaks;
		return Array.isArray(list) ? list : [];
	}, [range]);

	const stats = useMemo(() => {
		if (!peaks.length) return { count: 0, maxElev: null, minElev: null };

		let max = -Infinity;
		let min = Infinity;
		for (const p of peaks) {
			const e = Number(p.elevation_m);
			if (Number.isFinite(e)) {
				if (e > max) max = e;
				if (e < min) min = e;
			}
		}
		return {
			count: peaks.length,
			maxElev: Number.isFinite(max) ? max : null,
			minElev: Number.isFinite(min) ? min : null,
		};
	}, [peaks]);

	// Loading
	if (status === "loading") {
		return (
			<div style={wrap}>
				<div style={hero} />
				<div style={grid}>
					{Array.from({ length: 8 }).map((_, i) => (
						<PeakCardSkeleton key={i} />
					))}
				</div>
			</div>
		);
	}

	// Error
	if (status === "error") {
		return (
			<div style={wrap}>
				<div style={errorBox}>
					<div style={{ fontWeight: 900, marginBottom: 6 }}>Error</div>
					<div style={{ opacity: 0.9 }}>{error}</div>
					<div style={{ marginTop: 12 }}>
						<Link to='/ranges' style={backLink}>
							← {labels.backToRanges}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// Not found fallback
	if (!range) {
		return (
			<div style={wrap}>
				<div style={errorBox}>
					<div style={{ fontWeight: 900 }}>{labels.notFound}</div>
					<div style={{ marginTop: 12 }}>
						<Link to='/ranges' style={backLink}>
							← {labels.backToRanges}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={wrap}>
			{/* Breadcrumbs */}
			<nav style={crumbs} aria-label='Breadcrumb'>
				<Link to='/ranges' style={crumbLink}>
					{labels.ranges}
				</Link>
				<span style={crumbSep}>›</span>
				<span style={crumbCurrent}>{range.name || range.slug}</span>
			</nav>

			{/* Hero */}
			<section style={heroCard}>
				<div style={heroTopRow}>
					<div style={pill}>{labels.section}</div>
				</div>

				<h1 style={heroTitle(isMobile)}>{range.name || range.slug}</h1>

				<div style={statsRow}>
					<div style={statChip}>
						<div style={statLabel}>{labels.peaksCount}</div>
						<div style={statValue}>{stats.count}</div>
					</div>

					<div style={statChip}>
						<div style={statLabel}>{labels.maxElevation}</div>
						<div style={statValue}>
							{stats.maxElev != null ? `${stats.maxElev} m` : "—"}
						</div>
					</div>

					<div style={statChip}>
						<div style={statLabel}>{labels.minElevation}</div>
						<div style={statValue}>
							{stats.minElev != null ? `${stats.minElev} m` : "—"}
						</div>
					</div>
				</div>
			</section>

			{/* Peaks list */}
			<section style={{ marginTop: 14 }}>
				<div style={sectionHead}>
					<h2 style={h2}>{labels.peaksInRange}</h2>

					<Link to='/ranges' style={backLink}>
						← {labels.backToRanges}
					</Link>
				</div>

				{peaks.length === 0 ? (
					<div style={emptyBox}>{labels.empty}</div>
				) : (
					<div style={grid}>
						{peaks.map((p) => (
							<PeakCard key={p.slug} peak={p} lang={lang} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}

/* ----------------------------- i18n ----------------------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			ranges: "Pasma",
			section: "Pasmo górskie",
			openAsFilter: "Otwórz listę szczytów z filtrem tego pasma",
			peaksCount: "Szczyty",
			maxElevation: "Max wysokość",
			minElevation: "Min wysokość",
			peaksInRange: "Szczyty w tym paśmie",
			backToRanges: "Wróć do pasm",
			noDescription: "Brak opisu — w trakcie tworzenia.",
			empty: "Brak szczytów w tym paśmie.",
			notFound: "Nie znaleziono pasma",
		},
		en: {
			ranges: "Ranges",
			section: "Mountain range",
			openAsFilter: "Open peaks list filtered by this range",
			peaksCount: "Peaks",
			maxElevation: "Max elevation",
			minElevation: "Min elevation",
			peaksInRange: "Peaks in this range",
			backToRanges: "Back to ranges",
			noDescription: "No description yet — coming soon.",
			empty: "No peaks in this range.",
			notFound: "Range not found",
		},
		ua: {
			ranges: "Хребти",
			section: "Гірський хребет",
			openAsFilter: "Відкрити список вершин з фільтром цього хребта",
			peaksCount: "Вершини",
			maxElevation: "Макс висота",
			minElevation: "Мін висота",
			peaksInRange: "Вершини у цьому хребті",
			backToRanges: "Назад до хребтів",
			noDescription: "Опису ще немає — в процесі створення.",
			empty: "У цьому хребті немає вершин.",
			notFound: "Хребет не знайдено",
		},
		zh: {
			ranges: "山脉",
			section: "山脉",
			openAsFilter: "打开已按该山脉筛选的山峰列表",
			peaksCount: "山峰",
			maxElevation: "最高海拔",
			minElevation: "最低海拔",
			peaksInRange: "该山脉的山峰",
			backToRanges: "返回山脉",
			noDescription: "暂无介绍——敬请期待。",
			empty: "该山脉暂无山峰。",
			notFound: "未找到山脉",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ----------------------------- */

const wrap = {
	maxWidth: 1140,
	margin: "0 auto",
	padding: "8px 0 20px",
};

const crumbs = {
	display: "flex",
	alignItems: "center",
	gap: 8,
	marginBottom: 10,
	color: "var(--muted)",
	fontSize: 13,
};

const crumbLink = {
	color: "var(--muted)",
	textDecoration: "none",
	fontWeight: 900,
	borderBottom: "1px dashed var(--ink)",
};

const crumbSep = { opacity: 0.6 };

const crumbCurrent = {
	color: "var(--muted)",
	fontWeight: 900,
};

const hero = {
	height: 180,
	borderRadius: 22,
	border: "1px solid var(--border)",
	background: "rgba(15,23,42,0.04)",
	boxShadow: "var(--shadow-soft)",
};

const heroCard = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
};

const heroTopRow = {
	display: "flex",
	gap: 10,
	alignItems: "center",
	justifyContent: "space-between",
	flexWrap: "wrap",
	marginBottom: 10,
};

const pill = {
	display: "inline-flex",
	alignItems: "center",
	padding: "8px 12px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "var(--pill-bg)",
	color: "var(--muted)",
	fontWeight: 900,
	fontSize: 12,
};

const heroTitle = (isMobile) => ({
	margin: 0,
	fontSize: isMobile ? 28 : 34,
	letterSpacing: "-0.8px",
	lineHeight: 1.1,
});

const statsRow = {
	marginTop: 14,
	display: "flex",
	gap: 10,
	flexWrap: "wrap",
};

const statChip = {
	border: "1px solid var(--border)",
	background: "var(--surface)",
	borderRadius: 16,
	padding: "10px 12px",
	minWidth: 160,
	boxShadow: "var(--shadow-soft)",
};

const statLabel = { fontSize: 12, color: "var(--muted)", fontWeight: 900 };
const statValue = { fontSize: 18, fontWeight: 1000, marginTop: 4 };

const sectionHead = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "baseline",
	gap: 12,
	flexWrap: "wrap",
	marginBottom: 10,
};

const h2 = { margin: 0, fontSize: 16, letterSpacing: "-0.2px" };

const backLink = {
	textDecoration: "none",
	color: "var(--text)",
	fontWeight: 1000,
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	padding: "8px 10px",
	borderRadius: 14,
	display: "inline-flex",
};

const errorBox = {
	border: "1px solid rgba(239,68,68,0.25)",
	borderRadius: 22,
	padding: 16,
	background: "rgba(239,68,68,0.06)",
	boxShadow: "var(--shadow-soft)",
};

const emptyBox = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(15,23,42,0.03)",
	color: "var(--muted)",
	fontWeight: 900,
};

const grid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
	gap: 12,
	paddingTop: 6,
};
