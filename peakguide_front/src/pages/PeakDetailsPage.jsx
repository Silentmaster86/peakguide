import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
	fetchPeakBySlug,
	fetchPeakPoisBySlug,
	fetchPeakTrailsBySlug,
	fetchNearbyPeaksBySlug,
} from "../api/peakguide";
import { useMediaQuery } from "../hooks/useMediaQuery";
import PeakMap from "../components/PeakMap";

export default function PeakDetailsPage({ lang = "pl" }) {
	const { slug } = useParams();
	const isMobile = useMediaQuery("(max-width: 900px)");

	const [status, setStatus] = useState("loading"); // loading | success | error
	const [error, setError] = useState(null);
	const [peak, setPeak] = useState(null);

	const [trailsStatus, setTrailsStatus] = useState("idle"); // idle
	const [trails, setTrails] = useState([]);
	const [poisStatus, setPoisStatus] = useState("idle"); // idle
	const [pois, setPois] = useState([]);
	const [tab, setTab] = useState("overview"); // overview | trails | pois

	const [nearbyStatus, setNearbyStatus] = useState("idle"); // idle | loading | success | error
	const [nearbyPeaks, setNearbyPeaks] = useState([]);

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
		let cancelled = false;

		async function loadExtras() {
			setTrailsStatus("loading");
			setPoisStatus("loading");

			try {
				const [t, p] = await Promise.all([
					fetchPeakTrailsBySlug(lang, slug),
					fetchPeakPoisBySlug(lang, slug),
				]);

				if (cancelled) return;
				setTrails(Array.isArray(t) ? t : []);
				setPois(Array.isArray(p) ? p : []);
				setTrailsStatus("success");
				setPoisStatus("success");
			} catch {
				if (cancelled) return;
				setTrailsStatus("error");
				setPoisStatus("error");
			}
		}

		loadExtras();
		return () => {
			cancelled = true;
		};
	}, [lang, slug]);

	useEffect(() => {
		setTab("overview");
	}, [slug]);

	useEffect(() => {
		let cancelled = false;

		async function loadNearby() {
			if (!slug) return;
			setNearbyStatus("loading");
			setNearbyPeaks([]);

			try {
				const items = await fetchNearbyPeaksBySlug(lang, slug);
				if (cancelled) return;
				setNearbyPeaks(items);
				setNearbyStatus("success");
			} catch {
				if (cancelled) return;
				setNearbyStatus("error");
			}
		}

		loadNearby();
		return () => {
			cancelled = true;
		};
	}, [lang, slug, peak?.slug]);

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

			{/* Tab navigation */}

			<nav style={tabsWrap} aria-label='Sections'>
				<button
					type='button'
					onClick={() => setTab("overview")}
					style={tabBtn(tab === "overview")}
				>
					{labels.overview}
				</button>

				<button
					type='button'
					onClick={() => setTab("trails")}
					style={tabBtn(tab === "trails")}
				>
					{labels.trails}
					<span style={tabCount}>{trails.length}</span>
				</button>

				<button
					type='button'
					onClick={() => setTab("pois")}
					style={tabBtn(tab === "pois")}
				>
					{labels.pois}
					<span style={tabCount}>{pois.length}</span>
				</button>
			</nav>
			{tab === "overview" && (
				<>
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

							<div style={{ marginTop: 12 }}>
								<PeakMap
									name={peak.name}
									lat={peak.latitude}
									lon={peak.longitude}
								/>
							</div>
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
						<h3 style={rangeTitle}>
							{lang === "pl" ? "W pobliżu warto zdobyć" : "Nearby worth hiking"}
						</h3>

						{nearbyStatus === "loading" && <div style={muted}>Loading…</div>}
						{nearbyStatus === "error" && (
							<div style={muted}>Could not load nearby peaks.</div>
						)}
						{nearbyStatus === "success" && nearbyPeaks.length === 0 && (
							<div style={muted}>—</div>
						)}

						{nearbyStatus === "success" && nearbyPeaks.length > 0 && (
							<div style={rangeGrid}>
								{nearbyPeaks.map((p) => (
									<Link
										key={p.slug}
										to={`/peaks/${p.slug}`}
										style={{ textDecoration: "none", color: "inherit" }}
									>
										<article style={miniCard}>
											<div style={miniTitle}>{p.name || p.slug}</div>
											<div style={miniMeta}>
												⛰️ {p.elevation_m} m · 📍 {p.distance_km} km
											</div>
										</article>
									</Link>
								))}
							</div>
						)}
					</section>
				</>
			)}
			{/* Trails sections */}
			{tab === "trails" && (
				<>
					<section style={block}>
						<div style={blockHead}>
							<h2 style={blockTitle}>{labels.trails}</h2>
							<span style={countPill}>{trails.length}</span>
						</div>

						{trailsStatus === "loading" && (
							<div style={mutedRow}>{labels.loading}</div>
						)}
						{trailsStatus === "error" && (
							<div style={mutedRow}>{labels.failedTrails}</div>
						)}
						{trailsStatus === "success" && trails.length === 0 && (
							<div style={mutedRow}>{labels.noTrails}</div>
						)}

						{trails.map((t) => (
							<article key={t.slug} style={itemCard}>
								<div style={itemTop}>
									<div style={itemTitle}>{t.name}</div>
									{t.difficulty ? (
										<span style={badge}>{t.difficulty}</span>
									) : null}
								</div>

								<div style={metaRow}>
									{t.distance_km ? (
										<span style={metaPill}>🥾 {t.distance_km} km</span>
									) : null}
									{t.time_min ? (
										<span style={metaPill}>⏱️ {t.time_min} min</span>
									) : null}
									{t.elevation_gain_m ? (
										<span style={metaPill}>📈 +{t.elevation_gain_m} m</span>
									) : null}
									{t.route_type ? (
										<span style={metaPill}>🧭 {t.route_type}</span>
									) : null}
								</div>

								{t.description ? (
									<div style={itemText}>{t.description}</div>
								) : null}

								<div style={actionsRow}>
									{t.map_url ? (
										<a
											href={t.map_url}
											target='_blank'
											rel='noreferrer'
											style={actionBtn}
										>
											🗺️ {labels.openMap}
										</a>
									) : null}
									{t.gpx_url ? (
										<a
											href={t.gpx_url}
											target='_blank'
											rel='noreferrer'
											style={actionBtn}
										>
											🧾 GPX
										</a>
									) : null}
								</div>
							</article>
						))}
					</section>
				</>
			)}

			{/* POIs section */}

			{tab === "pois" && (
				<>
					<section style={block}>
						<div style={blockHead}>
							<h2 style={blockTitle}>{labels.pois}</h2>
							<span style={countPill}>{pois.length}</span>
						</div>

						{poisStatus === "loading" && (
							<div style={mutedRow}>{labels.loading}</div>
						)}
						{poisStatus === "error" && (
							<div style={mutedRow}>{labels.failedPois}</div>
						)}
						{poisStatus === "success" && pois.length === 0 && (
							<div style={mutedRow}>{labels.noPois}</div>
						)}

						{pois.map((poi) => (
							<article key={poi.id} style={itemCard}>
								<div style={itemTop}>
									<div style={itemTitle}>{poi.name}</div>
									<span style={badgeMuted}>{poi.type_name || "POI"}</span>
								</div>

								{poi.description ? (
									<div style={itemText}>{poi.description}</div>
								) : null}

								<div style={actionsRow}>
									{poi.google_maps_url ? (
										<a
											href={poi.google_maps_url}
											target='_blank'
											rel='noreferrer'
											style={actionBtn}
										>
											📍 Google Maps
										</a>
									) : null}
									{poi.website_url ? (
										<a
											href={poi.website_url}
											target='_blank'
											rel='noreferrer'
											style={actionBtn}
										>
											🔗 {labels.website}
										</a>
									) : null}
								</div>
							</article>
						))}
					</section>
				</>
			)}
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

			/* ------------------- trails and pois PL ------------------- */

			trails: "Szlaki",
			pois: "Punkty (POI)",
			loading: "Ładowanie…",
			noTrails: "Brak szlaków.",
			noPois: "Brak punktów POI.",
			failedTrails: "Nie udało się wczytać szlaków.",
			failedPois: "Nie udało się wczytać POI.",
			openMap: "Otwórz mapę",
			website: "Strona",
			overview: "Opis",
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

			/* ------------------- trails and pois EN ------------------- */

			trails: "Trails",
			pois: "Points (POI)",
			loading: "Loading…",
			noTrails: "No trails yet.",
			noPois: "No POIs yet.",
			failedTrails: "Failed to load trails.",
			failedPois: "Failed to load POIs.",
			openMap: "Open map",
			website: "Website",
			overview: "Overview",
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

			/* ------------------- trails and pois UA------------------- */

			trails: "Маршрути",
			pois: "Пункти (POI)",
			loading: "Завантаження…",
			noTrails: "Немає маршрутів.",
			noPois: "Немає POI.",
			failedTrails: "Не вдалося завантажити маршрути.",
			failedPois: "Не вдалося завантажити POI.",
			openMap: "Відкрити мапу",
			website: "Вебсайт",
			overview: "Огляд",
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

			/* ------------------- trails and pois ZH ------------------- */

			trails: "路线",
			pois: "兴趣点 (POI)",
			loading: "加载中…",
			noTrails: "暂无路线。",
			noPois: "暂无兴趣点。",
			failedTrails: "加载路线失败。",
			failedPois: "加载兴趣点失败。",
			openMap: "打开地图",
			website: "网站",
			overview: "概览",
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
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 18,
	background: "var(--menu-bg)",
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
	background: "var(--menu-bg)",
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
	color: "var(--text)",
};

const sideStyle = (isMobile) => ({
	// Keep sidebar sticky only on desktop
	position: isMobile ? "static" : "sticky",
	top: 14,
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
});

const sideTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
	marginBottom: 12,
	overflow: "hidden",
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
	padding: "10px 12px",
	borderRadius: 12,
	border: "1px solid var(--btn-border)",
	background: "color-mix(in srgb, var(--primary) 14%, transparent)",
	color: "var(--text)",
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
	background: "var(--btn-bg)",
	color: "var(--text)",
};

const miniBtn = {
	border: "1px solid var(--ink)",
	background: "var(--btn-bg)",
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
	background: "var(--menu-bg)",
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

/* ------------------- trails and pois ------------------- */

const block = {
	marginTop: 14,
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
};

const blockHead = {
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	gap: 10,
	marginBottom: 10,
};

const blockTitle = {
	margin: 0,
	fontSize: 16,
	letterSpacing: "-0.2px",
};

const countPill = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	minWidth: 34,
	height: 28,
	padding: "0 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "var(--pill-bg)",
	color: "var(--muted)",
	fontWeight: 1000,
	fontSize: 12,
};

const mutedRow = {
	color: "var(--muted)",
	padding: "8px 0",
	fontWeight: 800,
};

const itemCard = {
	border: "1px solid rgba(255,255,255,0.12)",
	borderRadius: 18,
	padding: 14,
	marginTop: 10,
	background: "color-mix(in srgb, var(--menu-bg) 60%, transparent)",
};

const itemTop = {
	display: "flex",
	gap: 10,
	alignItems: "baseline",
	justifyContent: "space-between",
};

const itemTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
};

const itemText = {
	marginTop: 8,
	opacity: 0.95,
	lineHeight: 1.6,
	whiteSpace: "pre-wrap",
};

const metaRow = {
	display: "flex",
	flexWrap: "wrap",
	gap: 8,
	marginTop: 10,
};

const metaPill = {
	display: "inline-flex",
	alignItems: "center",
	gap: 6,
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid rgba(255,255,255,0.12)",
	background: "rgba(255,255,255,0.04)",
	fontWeight: 900,
	fontSize: 12,
	color: "var(--muted)",
};

const badge = {
	display: "inline-flex",
	alignItems: "center",
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid var(--btn-border)",
	background: "color-mix(in srgb, var(--primary) 14%, transparent)",
	fontWeight: 1000,
	fontSize: 12,
};

const badgeMuted = {
	display: "inline-flex",
	alignItems: "center",
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid rgba(255,255,255,0.12)",
	background: "rgba(255,255,255,0.03)",
	color: "var(--muted)",
	fontWeight: 1000,
	fontSize: 12,
};

const actionsRow = {
	display: "flex",
	flexWrap: "wrap",
	gap: 10,
	marginTop: 12,
};

const actionBtn = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	gap: 8,
	padding: "9px 12px",
	borderRadius: 12,
	border: "1px solid var(--btn-border)",
	background: "var(--btn-bg)",
	color: "var(--text)",
	fontWeight: 1000,
	fontSize: 13,
	textDecoration: "none",
};

/* ------------------- tabs ------------------- */

const tabsWrap = {
	position: "sticky",
	top: 10,
	zIndex: 5,
	display: "flex",
	gap: 8,
	padding: 10,
	marginBottom: 14,
	borderRadius: 18,
	border: "1px solid var(--border)",
	background: "color-mix(in srgb, var(--menu-bg) 85%, transparent)",
	backdropFilter: "blur(8px)",
};

const tabBtn = (active) => ({
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: "10px 12px",
	borderRadius: 999,
	border: active ? "1px solid var(--btn-border)" : "1px solid var(--border)",
	background: active
		? "color-mix(in srgb, var(--primary) 16%, transparent)"
		: "var(--btn-bg)",
	color: "var(--text)",
	fontWeight: 1000,
	cursor: "pointer",
});

const tabCount = {
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	minWidth: 22,
	height: 20,
	padding: "0 8px",
	borderRadius: 999,
	border: "1px solid rgba(255,255,255,0.14)",
	color: "var(--muted)",
	fontSize: 12,
	fontWeight: 1000,
};
