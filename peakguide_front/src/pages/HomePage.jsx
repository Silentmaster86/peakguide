import { useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchPeaks } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";

/**
 * HomePage — Welcome (minimal)
 * - Pure info (no dots/bullets)
 * - No duplicated navigation (Navbar owns navigation)
 * - Optional small "Featured" section to keep the home alive
 */

export default function HomePage({ lang = "pl" }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	// Optional: keep featured peaks to make home feel "alive".
	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang]);
	const peaks = Array.isArray(peaksState.data) ? peaksState.data : [];

	const featured = useMemo(() => {
		const sorted = [...peaks].sort(
			(a, b) => (b.elevation_m || 0) - (a.elevation_m || 0),
		);
		return sorted.slice(0, 4);
	}, [peaks]);

	return (
		<div style={wrap}>
			<section style={welcome} aria-label='Welcome'>
				<div style={kicker}>{t.kicker}</div>
				<h1 style={title}>{t.title}</h1>

				<p style={lead}>{t.subtitle}</p>
				<p style={para}>{t.p1}</p>
				<p style={para}>{t.p2}</p>
			</section>

			<section style={panel} aria-label='Featured peaks'>
				<div style={sectionHead}>
					<h2 style={h2}>{t.featuredTitle}</h2>
					<span style={microMuted}>{t.featuredHint}</span>
				</div>

				{peaksState.status === "loading" ? (
					<div style={cardsGrid}>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i} style={{ ...card, ...cardSkeleton }} />
						))}
					</div>
				) : peaksState.status === "error" ? (
					<div style={noticeWarn}>
						<div style={{ fontWeight: 1000 }}>{t.featuredErrorTitle}</div>
						<div style={{ opacity: 0.85, marginTop: 6 }}>
							{String(peaksState.error || t.featuredErrorBody)}
						</div>
					</div>
				) : featured.length === 0 ? (
					<div style={notice}>{t.featuredEmpty}</div>
				) : (
					<div style={cardsGrid}>
						{featured.map((p) => (
							<Link key={p.slug} to={`/peaks/${p.slug}`} style={cardLink}>
								<article style={card}>
									<div style={cardTop}>
										<div style={{ minWidth: 0 }}>
											<div style={cardTitle} title={p.peak_name || p.name}>
												{p.peak_name || p.name}
											</div>
											<div style={cardSub}>{p.range_name || "—"}</div>
										</div>

										<div style={elevBadge} title={t.elevation}>
											{p.elevation_m} m
										</div>
									</div>

									<div style={cardBottom}>
										<span style={micro}>{t.openDetails}</span>
										<span style={arrow}>→</span>
									</div>
								</article>
							</Link>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

/* ----------------------------- labels ----------------------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			kicker: "Witaj",
			title: "Przewodnik",
			subtitle:
				"Przewodnik po Koronie Gór Polski, który ma być po prostu użyteczny: szybko znajdziesz szczyt, sprawdzisz pasmo i wejdziesz w detale.",
			p1: "Na górze masz nawigację do listy szczytów i pasm. Tam możesz przeglądać, filtrować i wybierać kolejne miejsca.",
			p2: "Projekt będzie rozwijany o bardziej praktyczne informacje (start, dojazd, parking, wskazówki) — bez zbędnych ozdobników.",
			featuredTitle: "Polecane",
			featuredHint: "Kilka propozycji na start",
			elevation: "Wysokość",
			openDetails: "Otwórz szczegóły",
			featuredEmpty: "Brak danych — dodaj szczyty do bazy lub uruchom API.",
			featuredErrorTitle: "Nie udało się pobrać szczytów",
			featuredErrorBody: "Sprawdź API / proxy w Vite.",
		},
		en: {
			kicker: "Welcome",
			title: "PeakGuide",
			subtitle:
				"A guide to the Crown of Polish Mountains built to be genuinely useful: find a peak fast, check its range, and open clean details.",
			p1: "Use the top navigation to browse peaks and ranges. That’s where you explore, filter and pick where to go next.",
			p2: "Next updates will add practical info (trail start, access, parking, tips) — without unnecessary fluff.",
			featuredTitle: "Featured",
			featuredHint: "A few picks to start",
			elevation: "Elevation",
			openDetails: "Open details",
			featuredEmpty: "No data yet — seed the DB or start the API.",
			featuredErrorTitle: "Failed to load peaks",
			featuredErrorBody: "Check API / Vite proxy.",
		},
		ua: {
			kicker: "Вітаю",
			title: "Путівник",
			subtitle:
				"Путівник по Короні польських гір, який має бути справді корисним: швидко знайдеш вершину, побачиш хребет і відкриєш деталі.",
			p1: "У верхньому меню є навігація до списку вершин і хребтів — там можна переглядати, фільтрувати й обирати наступні місця.",
			p2: "Далі додамо практичні речі (старт, доїзд, паркінг, поради) — без зайвих прикрас.",
			featuredTitle: "Вибране",
			featuredHint: "Кілька варіантів для старту",
			elevation: "Висота",
			openDetails: "Відкрити деталі",
			featuredEmpty: "Немає даних — заповни базу або запусти API.",
			featuredErrorTitle: "Не вдалося завантажити вершини",
			featuredErrorBody: "Перевір API / proxy у Vite.",
		},
		zh: {
			kicker: "欢迎",
			title: "高峰指南",
			subtitle:
				"一个真正实用的波兰山峰王冠指南：快速找到山峰，查看所属山脉，并进入清晰的详情页。",
			p1: "请使用顶部导航浏览山峰与山脉列表。在那里你可以筛选、查找并选择下一站。",
			p2: "后续会加入更实用的信息（起点、到达方式、停车、提示），不做多余装饰。",
			featuredTitle: "精选",
			featuredHint: "给你几个起步选择",
			elevation: "海拔",
			openDetails: "打开详情",
			featuredEmpty: "暂无数据 — 请先填充数据库或启动 API。",
			featuredErrorTitle: "加载山峰失败",
			featuredErrorBody: "请检查 API / Vite 代理。",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ----------------------------- */

const wrap = { display: "grid", gap: 14 };

const welcome = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background:
		"radial-gradient(900px 340px at 20% 0%, rgba(31,122,79,0.10), transparent 60%), radial-gradient(700px 340px at 90% 20%, rgba(217,119,6,0.08), transparent 55%), var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const kicker = {
	fontSize: 12,
	fontWeight: 950,
	opacity: 0.8,
	letterSpacing: "0.2px",
	textTransform: "uppercase",
};

const title = {
	margin: "6px 0 0",
	fontSize: 26,
	letterSpacing: "-0.7px",
	lineHeight: 1.1,
};

const lead = {
	margin: "10px 0 0",
	opacity: 0.88,
	lineHeight: 1.7,
	maxWidth: 900,
};

const para = {
	margin: "10px 0 0",
	opacity: 0.82,
	lineHeight: 1.7,
	maxWidth: 900,
};

const panel = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "rgba(255,255,255,0.70)",
	boxShadow: "var(--shadow-soft)",
};

const sectionHead = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "baseline",
	gap: 10,
	flexWrap: "wrap",
	marginBottom: 10,
};

const h2 = { margin: 0, fontSize: 16, letterSpacing: "-0.2px" };
const microMuted = { opacity: 0.7, fontSize: 12, fontWeight: 900 };

const cardsGrid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
	gap: 12,
};

const cardLink = { textDecoration: "none", color: "inherit" };

const card = {
	border: "1px solid rgba(15,23,42,0.10)",
	borderRadius: 18,
	padding: 14,
	background: "var(--surface-2)",
	boxShadow: "var(--shadow-soft)",
};

const cardSkeleton = {
	height: 110,
	background:
		"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
	backgroundSize: "200% 100%",
	animation: "shimmer 1.2s infinite",
};

const cardTop = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "flex-start",
	gap: 12,
};

const cardTitle = {
	fontWeight: 1100,
	letterSpacing: "-0.2px",
	fontSize: 16,
	whiteSpace: "nowrap",
	overflow: "hidden",
	textOverflow: "ellipsis",
};

const cardSub = { marginTop: 6, opacity: 0.75, fontSize: 13 };

const elevBadge = {
	border: "1px solid rgba(31,122,79,0.22)",
	borderRadius: 999,
	padding: "7px 10px",
	fontWeight: 1000,
	fontSize: 13,
	whiteSpace: "nowrap",
	color: "var(--primary)",
	background: "rgba(31,122,79,0.08)",
};

const cardBottom = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	marginTop: 12,
};

const micro = { opacity: 0.7, fontSize: 12, fontWeight: 900 };
const arrow = { fontWeight: 1100, opacity: 0.85 };

const notice = {
	border: "1px solid var(--border)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(15,23,42,0.03)",
	opacity: 0.85,
	fontWeight: 900,
};

const noticeWarn = {
	border: "1px solid rgba(185,28,28,0.25)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(185,28,28,0.06)",
};
