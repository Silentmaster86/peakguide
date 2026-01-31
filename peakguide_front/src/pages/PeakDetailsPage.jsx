import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPeakBySlug, fetchPeaks } from "../api/peakguide";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function PeakDetailsPage({ lang = "pl" }) {
	const { slug } = useParams();
	const isMobile = useMediaQuery("(max-width: 900px)");

	const [status, setStatus] = useState("loading"); // loading | success | error
	const [error, setError] = useState(null);
	const [peak, setPeak] = useState(null);

	const [rangePeaks, setRangePeaks] = useState([]);
	const [rangeStatus, setRangeStatus] = useState("idle"); // idle | loading | success | error

	const labels = useMemo(() => getLabels(lang), [lang]);

	const gridStyle = useMemo(
		() => ({
			display: "grid",
			gridTemplateColumns: isMobile ? "1fr" : "1.6fr 0.9fr",
			gap: 14,
			alignItems: "start",
		}),
		[isMobile],
	);

	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				setStatus("loading");
				setError(null);
				setPeak(null);

				// Load peak details by slug
				const data = await fetchPeakBySlug(lang, slug);

				if (!alive) return;
				setPeak(data);
				setStatus("success");
			} catch (e) {
				if (!alive) return;
				setError(e?.message || "Failed to load peak");
				setStatus("error");
			}
		})();

		return () => {
			alive = false;
		};
	}, [lang, slug]);

	useEffect(() => {
		// Wait until peak details are loaded (range_slug is needed)
		if (!peak?.range_slug) return;

		let alive = true;

		(async () => {
			try {
				setRangeStatus("loading");
				setRangePeaks([]);

				// Load all peaks and filter by the same range
				const all = await fetchPeaks({ lang });

				if (!alive) return;

				const related = (Array.isArray(all) ? all : [])
					.filter((p) => p.range_slug === peak.range_slug)
					.filter((p) => p.slug !== peak.slug)
					.slice(0, 6);

				setRangePeaks(related);
				setRangeStatus("success");
			} catch {
				if (!alive) return;
				setRangeStatus("error");
			}
		})();

		return () => {
			alive = false;
		};
	}, [lang, peak?.range_slug, peak?.slug]);

	const mapUrl = useMemo(() => {
		if (!peak) return null;

		const lat = Number(peak.latitude);
		const lon = Number(peak.longitude);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

		// Google Maps query URL
		return `https://www.google.com/maps?q=${lat},${lon}`;
	}, [peak]);

	const coordsText = useMemo(() => {
		if (!peak) return "";

		const lat = Number(peak.latitude);
		const lon = Number(peak.longitude);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) return "";

		return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
	}, [peak]);

	async function handleCopy(text) {
		try {
			// Copy to clipboard (requires HTTPS or localhost)
			await navigator.clipboard.writeText(text);
		} catch {
			// Ignore copy errors silently for now
		}
	}

	// Loading state
	if (status === "loading") {
		return (
			<div style={wrap}>
				<div style={skeletonHero} />
				<div style={gridStyle}>
					<div style={skeletonBody} />
					<div style={skeletonSide} />
				</div>
			</div>
		);
	}

	// Error state
	if (status === "error") {
		return (
			<div style={wrap}>
				<div style={errorBox}>
					<div style={{ fontWeight: 900, marginBottom: 6 }}>Error</div>
					<div style={{ opacity: 0.9 }}>{error}</div>
					<div style={{ marginTop: 12 }}>
						<Link to='/peaks' style={backLink}>
							← {labels.back}
						</Link>
					</div>
				</div>
			</div>
		);
	}

	// Not found state
	if (!peak) {
		return (
			<div style={wrap}>
				<div style={errorBox}>
					<div style={{ fontWeight: 900 }}>{labels.notFound}</div>
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
			{/* Breadcrumbs */}
			<nav style={crumbs} aria-label='Breadcrumb'>
				<Link to='/peaks' style={crumbLink}>
					{labels.peaks}
				</Link>

				<span style={crumbSep}>›</span>

				<Link to='/ranges' style={crumbLink}>
					{labels.ranges}
				</Link>

				<span style={crumbSep}>›</span>

				{peak.range_slug ? (
					<Link
						to={`/ranges/${encodeURIComponent(peak.range_slug)}`}
						style={crumbLink}
						title={labels.range}
					>
						{peak.range_name || peak.range_slug}
					</Link>
				) : (
					<span style={crumbCurrent}>{peak.range_name || "—"}</span>
				)}

				<span style={crumbSep}>›</span>
				<span style={crumbCurrent}>{peak.name}</span>
			</nav>

			{/* Back link */}
			{isMobile && (
				<div style={{ marginBottom: 10 }}>
					<Link to='/peaks' style={backLink}>
						← {labels.back}
					</Link>
				</div>
			)}
			{/* Hero */}
			<section style={hero}>
				{/* Optional small context pill (not duplicating Info) */}
				<div style={heroTopRow}>
					<div style={heroPillMuted}>
						{lang === "pl"
							? "Korona Gór Polski"
							: lang === "en"
								? "Crown of Polish Mountains"
								: lang === "ua"
									? "Корона гір Польщі"
									: "波兰山峰王冠"}
					</div>
				</div>

				<h1 style={heroTitle(isMobile)}>{peak.name}</h1>

				{peak.short_description ? (
					<p style={heroSubtitle}>{peak.short_description}</p>
				) : (
					<p style={heroSubtitle}>{lang === "pl" ? "—" : "—"}</p>
				)}
			</section>

			{/* Main content */}
			<div style={gridStyle}>
				{/* Left column */}
				<section style={panel}>
					<h2 style={h2}>{labels.description}</h2>

					{peak.description ? (
						<div style={textBlock}>{peak.description}</div>
					) : (
						<div style={muted}>—</div>
					)}
				</section>

				{/* Right info panel */}
				<aside style={sideStyle(isMobile)}>
					<div style={sideTitle}>Info</div>

					<div style={kv}>
						<div style={k}>{labels.elevation}</div>
						<div style={v}>{peak.elevation_m} m</div>
					</div>

					<div style={kv}>
						<div style={k}>{labels.range}</div>
						<div style={v}>{peak.range_name || "—"}</div>
					</div>

					<div style={divider} />

					<div style={kv}>
						<div style={k}>{labels.coords}</div>
						<div style={v}>
							{coordsText ? (
								<div style={coordsRow}>
									<code style={code}>{coordsText}</code>
									<button
										type='button'
										style={miniBtn}
										onClick={() => handleCopy(coordsText)}
										title='Copy coordinates'
									>
										{labels.copy}
									</button>
								</div>
							) : (
								"—"
							)}
						</div>
					</div>

					{mapUrl && (
						<a href={mapUrl} target='_blank' rel='noreferrer' style={cta}>
							🗺️ {labels.openMaps}
						</a>
					)}
				</aside>
			</div>

			{/* Peaks in the same range */}
			<section style={rangeSection}>
				<h3 style={rangeTitle}>{labels.inRange}</h3>

				{rangeStatus === "loading" && <div style={muted}>Loading…</div>}

				{rangeStatus === "error" && (
					<div style={muted}>Could not load related peaks.</div>
				)}

				{rangeStatus === "success" && rangePeaks.length === 0 && (
					<div style={muted}>—</div>
				)}

				{rangeStatus === "success" && rangePeaks.length > 0 && (
					<div style={rangeGrid}>
						{rangePeaks.map((p) => (
							<Link
								key={p.slug}
								to={`/peaks/${p.slug}`}
								style={{ textDecoration: "none", color: "inherit" }}
							>
								<article style={miniCard}>
									<div style={miniTitle}>{p.peak_name}</div>
									<div style={miniMeta}>⛰️ {p.elevation_m} m</div>
								</article>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

/* ----------------------------- helpers ----------------------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			peaks: "Szczyty",
			ranges: "Pasma",
			inRange: "W tym paśmie",
			back: "Wróć do listy",
			elevation: "Wysokość",
			range: "Pasmo",
			coords: "Współrzędne",
			openMaps: "Otwórz mapę",
			copy: "Kopiuj",
			description: "Opis",
			notFound: "Nie znaleziono szczytu",
		},
		en: {
			peaks: "Peaks",
			ranges: "Ranges",
			inRange: "In this range",
			back: "Back to list",
			elevation: "Elevation",
			range: "Range",
			coords: "Coordinates",
			openMaps: "Open map",
			copy: "Copy",
			description: "Description",
			notFound: "Peak not found",
		},
		ua: {
			peaks: "Вершини",
			ranges: "Хребти",
			inRange: "У цьому хребті",
			back: "Назад до списку",
			elevation: "Висота",
			range: "Хребет",
			coords: "Координати",
			openMaps: "Відкрити мапу",
			copy: "Копіювати",
			description: "Опис",
			notFound: "Вершину не знайдено",
		},
		zh: {
			peaks: "山峰",
			ranges: "山脉",
			inRange: "同一山脉",
			back: "返回列表",
			elevation: "海拔",
			range: "山脉",
			coords: "坐标",
			openMaps: "打开地图",
			copy: "复制",
			description: "介绍",
			notFound: "未找到该山峰",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ------------------------------ */

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
	color: "var(--text)",
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
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 18,
	background:
		"radial-gradient(900px 340px at 20% 0%, rgba(31,122,79,0.18), transparent 60%), radial-gradient(700px 340px at 90% 20%, rgba(217,119,6,0.14), transparent 55%), var(--surface)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const heroTopRow = {
	display: "flex",
	gap: 10,
	alignItems: "center",
	flexWrap: "wrap",
	marginBottom: 10,
};

const heroPillMuted = {
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

const heroSubtitle = {
	margin: "10px 0 0",
	color: "var(--muted)",
	maxWidth: 860,
	lineHeight: 1.6,
};

const panel = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const h2 = {
	margin: 0,
	fontSize: 16,
	letterSpacing: "-0.2px",
};

const textBlock = {
	marginTop: 10,
	lineHeight: 1.7,
	whiteSpace: "pre-wrap",
};

const muted = {
	marginTop: 10,
	color: "var(--muted)",
};

const sideStyle = (isMobile) => ({
	// Keep sidebar sticky only on desktop
	position: isMobile ? "static" : "sticky",
	top: 14,
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
});

const sideTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
	marginBottom: 12,
};

const kv = {
	display: "grid",
	gridTemplateColumns: "120px 1fr",
	gap: 10,
	padding: "8px 0",
};

const k = { color: "var(--muted)", fontSize: 13 };
const v = { fontWeight: 900 };

const divider = {
	height: 1,
	background: "var(--border)",
	margin: "10px 0",
};

const coordsRow = {
	display: "flex",
	gap: 8,
	alignItems: "center",
	flexWrap: "wrap",
};

const cta = {
	display: "inline-flex",
	width: "100%",
	justifyContent: "center",
	alignItems: "center",
	gap: 8,

	marginTop: 12,
	padding: "8px 10px", // mniejsze
	borderRadius: 12, // trochę mniejsze
	border: "1px solid var(--ink)",
	background: "var(--pill-bg)",

	color: "var(--primary)",
	fontWeight: 1000,
	fontSize: 13,
	textDecoration: "none",
};

const code = {
	fontFamily:
		"ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
	fontSize: 12,
	padding: "5px 8px",
	borderRadius: 10,
	border: "1px solid var(--ink)",
	background: "var(--wash)",
	color: "var(--text)",
};

const miniBtn = {
	border: "1px solid var(--ink)",
	background: "var(--wash)",
	color: "var(--text)",
	padding: "6px 10px",
	borderRadius: 12,
	cursor: "pointer",
	fontWeight: 900,
	fontSize: 12,
};

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

const skeletonHero = {
	height: 160,
	borderRadius: 22,
	border: "1px solid var(--border)",
	boxShadow: "var(--shadow-soft)",
	background:
		"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
	marginBottom: 14,
};

const skeletonBody = {
	height: 340,
	borderRadius: 22,
	border: "1px solid var(--border)",
	boxShadow: "var(--shadow-soft)",
	background:
		"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
};

const skeletonSide = {
	height: 240,
	borderRadius: 22,
	border: "1px solid var(--border)",
	boxShadow: "var(--shadow-soft)",
	background:
		"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
};

const rangeSection = {
	marginTop: 14,
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const rangeTitle = {
	margin: 0,
	fontSize: 15,
	letterSpacing: "-0.2px",
	fontWeight: 1000,
};

const rangeGrid = {
	marginTop: 12,
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
	gap: 10,
};

const miniCard = {
	border: "1px solid var(--ink)",
	borderRadius: 18,
	padding: 12,
	background: "var(--surface-2)",
	boxShadow: "var(--shadow-soft)",
	transition: "transform 140ms ease, box-shadow 140ms ease",
};

const miniTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
};

const miniMeta = {
	marginTop: 6,
	color: "var(--muted)",
	fontSize: 12,
	fontWeight: 900,
};
