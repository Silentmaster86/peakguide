import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEO } from "../seo/SEO";
import { SITE_URL, SITE_NAME } from "../seo/site";
import { fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";

export default function RangesPage({ lang = "pl" }) {
	const [refreshKey, setRefreshKey] = useState(0);

	const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);

	const ranges = useMemo(() => rangesState.data || [], [rangesState.data]);

	const isLoading = rangesState.status === "loading";
	const isError = rangesState.status === "error";

	const t = useMemo(() => getLabels(lang), [lang]);

	const canonical = `${SITE_URL}/ranges`;

	const title =
		lang === "pl"
			? `Pasma górskie — ${SITE_NAME}`
			: `Mountain ranges — ${SITE_NAME}`;

	const description =
		lang === "pl"
			? "Lista pasm górskich w Polsce. Wybierz pasmo, aby zobaczyć szczyty i przejść do szczegółów."
			: "Browse mountain ranges in Poland. Pick a range to see peaks and open details.";

	return (
		<div style={{ display: "grid", gap: 14 }}>
			{/* SEO & Social tags */}
			<SEO title={title} description={description} canonical={canonical} />
			<div style={headerCard}>
				<div style={pill}>🏔️ {t.title}</div>
				<div style={sub}>{t.subtitle}</div>
			</div>

			{isError && (
				<div style={errorBox}>
					<div style={{ fontWeight: 900, marginBottom: 6 }}>{t.errorTitle}</div>
					<div style={{ opacity: 0.9, marginBottom: 10 }}>
						{rangesState.error}
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
						: ranges.map((r) => (
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
											<div style={rangeName}>{r.name}</div>
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
		},
		en: {
			title: "Ranges",
			subtitle: "Pick a range to see its peaks.",
			errorTitle: "Failed to load ranges",
			retry: "Retry",
		},
		ua: {
			title: "Хребти",
			subtitle: "Оберіть хребет, щоб побачити вершини.",
			errorTitle: "Не вдалося завантажити хребти",
			retry: "Спробувати ще раз",
		},
		zh: {
			title: "山脉",
			subtitle: "选择山脉以查看山峰列表。",
			errorTitle: "无法加载山脉列表",
			retry: "重试",
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
