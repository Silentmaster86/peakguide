import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SEO } from "../seo/SEO";
import { SITE_URL, SITE_NAME } from "../seo/site";
import { fetchCountries, fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";

export default function RangesPage({ lang = "pl" }) {
	const [refreshKey, setRefreshKey] = useState(0);
	const [searchParams, setSearchParams] = useSearchParams();
	const country = searchParams.get("country") || "all";
	const region = searchParams.get("region") || "all";

	const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);
	const countriesState = useAsync(
		() => fetchCountries({ lang }),
		[lang, refreshKey],
	);

	const ranges = useMemo(() => rangesState.data || [], [rangesState.data]);
	const countries = useMemo(
		() => countriesState.data || [],
		[countriesState.data],
	);
	const selectedCountry = countries.find((item) => item.code === country);
	const regions = selectedCountry?.regions || [];
	const visibleRanges = useMemo(
		() =>
			ranges.filter((item) => {
				if (country !== "all" && item.country_code !== country) return false;
				if (region !== "all" && item.region_slug !== region) return false;
				return true;
			}),
		[ranges, country, region],
	);

	const isLoading =
		rangesState.status === "loading" || countriesState.status === "loading";
	const isError =
		rangesState.status === "error" || countriesState.status === "error";

	const t = useMemo(() => getLabels(lang), [lang]);

	const canonical = `${SITE_URL}/ranges`;

	const title =
		lang === "pl"
			? `Pasma górskie — ${SITE_NAME}`
			: `Mountain ranges — ${SITE_NAME}`;

	const description =
		lang === "pl"
			? "Lista pasm górskich w Polsce i Wielkiej Brytanii. Filtruj według kraju i regionu, aby znaleźć szczyty."
			: "Browse mountain ranges in Poland and the United Kingdom. Filter by country and region to find peaks.";

	function updateCountry(value) {
		const next = new URLSearchParams(searchParams);
		if (value === "all") next.delete("country");
		else next.set("country", value);
		next.delete("region");
		setSearchParams(next, { replace: true });
	}

	function updateRegion(value) {
		const next = new URLSearchParams(searchParams);
		if (value === "all") next.delete("region");
		else next.set("region", value);
		setSearchParams(next, { replace: true });
	}

	return (
		<div style={{ display: "grid", gap: 14 }}>
			{/* SEO & Social tags */}
			<SEO title={title} description={description} canonical={canonical} />
			<div style={headerCard}>
				<div style={pill}>🏔️ {t.title}</div>
				<div style={sub}>{t.subtitle}</div>
				<div style={filters}>
					<label style={filterField}>
						<span style={filterLabel}>{t.country}</span>
						<select
							value={country}
							onChange={(event) => updateCountry(event.target.value)}
							style={select}
						>
							<option value='all'>{t.allCountries}</option>
							{countries.map((item) => (
								<option key={item.code} value={item.code}>
									{item.flag_emoji} {item.name}
								</option>
							))}
						</select>
					</label>

					{regions.length > 0 ? (
						<label style={filterField}>
							<span style={filterLabel}>{t.region}</span>
							<select
								value={region}
								onChange={(event) => updateRegion(event.target.value)}
								style={select}
							>
								<option value='all'>{t.allRegions}</option>
								{regions.map((item) => (
									<option key={item.slug} value={item.slug}>
										{item.name}
									</option>
								))}
							</select>
						</label>
					) : null}
				</div>
			</div>

			{isError && (
				<div style={errorBox}>
					<div style={{ fontWeight: 900, marginBottom: 6 }}>{t.errorTitle}</div>
					<div style={{ opacity: 0.9, marginBottom: 10 }}>
						{rangesState.error || countriesState.error}
					</div>
					<button
						type='button'
						style={retryBtn}
						onClick={() => setRefreshKey((x) => x + 1)}
					>
						{t.retry}
					</button>
				</div>
			)}

			{!isError && (
				<div style={grid}>
					{isLoading
						? Array.from({ length: 10 }).map((_, i) => (
								<RangeCardSkeleton key={i} />
							))
						: visibleRanges.map((r) => (
								<Link
									key={r.slug}
									to={`/ranges/${r.slug}`}
									style={{ textDecoration: "none", color: "inherit" }}
								>
									<article
										style={card}
										onMouseEnter={(e) => {
											e.currentTarget.style.transform = "translateY(-2px)";
											e.currentTarget.style.boxShadow = "var(--shadow)";
										}}
										onMouseLeave={(e) => {
											e.currentTarget.style.transform = "translateY(0px)";
											e.currentTarget.style.boxShadow = "var(--shadow-soft)";
										}}
									>
										<div style={cardTop}>
											<div>
												<div style={rangeName}>{r.name}</div>
												<div style={locationText}>
													{r.country_flag}{" "}
													{r.region_name || r.country_name}
												</div>
											</div>
											<div style={rangeBadge}>→</div>
										</div>
									</article>
								</Link>
							))}
				</div>
			)}
		</div>
	);
}

/* ----------------------------- labels ------------------------------ */

function getLabels(lang) {
	const dict = {
		pl: {
			title: "Pasma",
			subtitle: "Wybierz pasmo, aby zobaczyć listę szczytów.",
			errorTitle: "Nie udało się pobrać pasm",
			retry: "Spróbuj ponownie",
			country: "Kraj",
			allCountries: "Wszystkie kraje",
			region: "Region",
			allRegions: "Wszystkie regiony",
		},
		en: {
			title: "Ranges",
			subtitle: "Pick a range to see its peaks.",
			errorTitle: "Failed to load ranges",
			retry: "Retry",
			country: "Country",
			allCountries: "All countries",
			region: "Region",
			allRegions: "All regions",
		},
		ua: {
			title: "Хребти",
			subtitle: "Оберіть хребет, щоб побачити вершини.",
			errorTitle: "Не вдалося завантажити хребти",
			retry: "Спробувати ще раз",
			country: "Країна",
			allCountries: "Усі країни",
			region: "Регіон",
			allRegions: "Усі регіони",
		},
		zh: {
			title: "山脉",
			subtitle: "选择山脉以查看山峰列表。",
			errorTitle: "无法加载山脉列表",
			retry: "重试",
			country: "国家",
			allCountries: "所有国家",
			region: "地区",
			allRegions: "所有地区",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- UI bits ----------------------------- */

function RangeCardSkeleton() {
	return (
		<div style={skeletonCard}>
			<div style={skeletonLineWide} />
			<div style={skeletonLineSmall} />
		</div>
	);
}

/* ----------------------------- styles ------------------------------ */

const headerCard = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 12,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
};

const pill = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: "6px 10px",
	borderRadius: 999,
	border: "1px solid var(--border)",
	background: "rgba(31, 122, 79, 0.93)",
	color: "var(--btn-bg)",
	fontWeight: 900,
	fontSize: 12,
};

const sub = {
	marginTop: 8,
	color: "var(--text)",
	fontSize: 13,
};

const filters = {
	display: "flex",
	flexWrap: "wrap",
	gap: 10,
	marginTop: 12,
};

const filterField = {
	display: "grid",
	gap: 6,
	minWidth: 210,
	flex: "1 1 210px",
};

const filterLabel = {
	fontSize: 12,
	fontWeight: 800,
	letterSpacing: "0.8px",
};

const select = {
	height: 42,
	padding: "0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
};

const grid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
	gap: 10,
};

const card = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 12,
	background: "var(--btn-bg)",
	boxShadow: "var(--shadow-soft)",
	transition: "transform 140ms ease, box-shadow 140ms ease",
};

const cardTop = {
	display: "flex",
	justifyContent: "space-between",
	gap: 10,
	alignItems: "center",
};

const rangeName = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
	fontSize: 16,
};

const locationText = {
	marginTop: 4,
	color: "var(--muted)",
	fontSize: 12,
};

const rangeBadge = {
	border: "1px solid rgba(31,122,79,0.30)",
	borderRadius: 999,
	padding: "6px 10px",
	fontWeight: 1000,
	color: "var(--primary)",
	background: "rgba(31,122,79,0.10)",
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

/* Skeletons (uses your shimmer keyframes) */
const skeletonCard = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 14,
	background:
		"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
	boxShadow: "var(--shadow-soft)",
};

const skeletonLineWide = {
	height: 16,
	borderRadius: 10,
	background: "rgba(255,255,255,0.35)",
	width: "72%",
};

const skeletonLineSmall = {
	marginTop: 10,
	height: 12,
	borderRadius: 10,
	background: "rgba(255,255,255,0.30)",
	width: "40%",
};
