import { Link } from "react-router-dom";

export default function HomePage({ lang = "pl" }) {
	const t = getLabels(lang);

	return (
		<div style={wrap}>
			<section style={hero}>
				<div style={heroTop}>
					<div style={pill}>⛰️ {t.pill}</div>
					<div style={heroHint}>{t.hint}</div>
				</div>

				<h1 style={h1}>{t.title}</h1>
				<p style={lead}>{t.subtitle}</p>

				<div style={actions}>
					<Link to='/peaks' style={actionPrimary}>
						{t.goPeaks} →
					</Link>
					<Link to='/ranges' style={actionSecondary}>
						{t.goRanges} →
					</Link>
					<div style={actionGhost} title={t.soonTip}>
						{t.goRoutes} <span style={soonPill}>{t.soon}</span>
					</div>
				</div>
			</section>

			<section style={grid}>
				<Link to='/peaks' style={cardLink}>
					<article style={card}>
						<div style={cardTitle}>{t.peaks}</div>
						<div style={cardDesc}>{t.peaksDesc}</div>
						<div style={cardMeta}>/peaks</div>
					</article>
				</Link>

				<Link to='/ranges' style={cardLink}>
					<article style={card}>
						<div style={cardTitle}>{t.ranges}</div>
						<div style={cardDesc}>{t.rangesDesc}</div>
						<div style={cardMeta}>/ranges</div>
					</article>
				</Link>

				<article style={{ ...card, ...cardDisabled }} title={t.soonTip}>
					<div style={cardTitle}>
						{t.routes} <span style={soonPill}>{t.soon}</span>
					</div>
					<div style={cardDesc}>{t.routesDesc}</div>
					<div style={cardMeta}>—</div>
				</article>

				<article style={{ ...card, ...cardDisabled }} title={t.soonTip}>
					<div style={cardTitle}>
						{t.trailheads} <span style={soonPill}>{t.soon}</span>
					</div>
					<div style={cardDesc}>{t.trailheadsDesc}</div>
					<div style={cardMeta}>—</div>
				</article>
			</section>

			<section style={statusCard}>
				<div style={statusTitle}>{t.statusTitle}</div>

				<div style={statusGrid}>
					<div style={statusItem}>
						<div style={statusDotOk} />
						<div>
							<div style={statusName}>{t.done1}</div>
							<div style={statusDesc}>{t.done1Desc}</div>
						</div>
					</div>

					<div style={statusItem}>
						<div style={statusDotOk} />
						<div>
							<div style={statusName}>{t.done2}</div>
							<div style={statusDesc}>{t.done2Desc}</div>
						</div>
					</div>

					<div style={statusItem}>
						<div style={statusDotSoon} />
						<div>
							<div style={statusName}>
								{t.todo1} <span style={miniSoon}>{t.soon}</span>
							</div>
							<div style={statusDesc}>{t.todo1Desc}</div>
						</div>
					</div>

					<div style={statusItem}>
						<div style={statusDotSoon} />
						<div>
							<div style={statusName}>
								{t.todo2} <span style={miniSoon}>{t.soon}</span>
							</div>
							<div style={statusDesc}>{t.todo2Desc}</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}

function getLabels(lang) {
	const dict = {
		pl: {
			pill: "PeakGuide",
			hint: "MVP • prosta nawigacja • szybkie filtrowanie",
			title: "Korona Gór Polski i nie tylko",
			subtitle:
				"Szczyty, pasma i opisy w jednym miejscu. Trasy i punkty startowe dołożymy w kolejnych krokach.",
			peaks: "Szczyty",
			peaksDesc: "Lista + karta szczegółów (opis, mapa, breadcrumbs).",
			ranges: "Pasma",
			rangesDesc: "Lista pasm + strona pasma z listą szczytów.",
			routes: "Trasy",
			routesDesc: "Planowane: szlaki, czas przejścia, GPX.",
			trailheads: "Punkty startowe",
			trailheadsDesc: "Planowane: parkingi, start szlaku, dojazd, mapy.",
			soon: "wkrótce",
			soonTip: "Ta sekcja będzie dostępna wkrótce.",
			goPeaks: "Przeglądaj szczyty",
			goRanges: "Przeglądaj pasma",
			goRoutes: "Trasy",
			statusTitle: "Co jest gotowe",
			done1: "Routing + breadcrumbs",
			done1Desc: "Peaks → Ranges → Range → Peak (czytelna nawigacja).",
			done2: "Detale szczytu",
			done2Desc: "Opis, współrzędne, link do mapy, panel info.",
			todo1: "Trasy",
			todo1Desc: "Podpinamy tabele tras + relacje peak↔route.",
			todo2: "Punkty startowe",
			todo2Desc: "Miejsca startu, parkingi, dojazd + linki do map.",
		},
		en: {
			pill: "PeakGuide",
			hint: "MVP • clean navigation • quick filtering",
			title: "Crown of Polish Mountains & more",
			subtitle:
				"Peaks and ranges in one place. Routes and trailheads are next.",
			peaks: "Peaks",
			peaksDesc: "List + details (description, map, breadcrumbs).",
			ranges: "Ranges",
			rangesDesc: "Ranges list + range page with peaks inside.",
			routes: "Routes",
			routesDesc: "Planned: trails, duration, GPX.",
			trailheads: "Trailheads",
			trailheadsDesc: "Planned: parking, trail start, access, maps.",
			soon: "soon",
			soonTip: "This section is coming soon.",
			goPeaks: "Browse peaks",
			goRanges: "Browse ranges",
			goRoutes: "Routes",
			statusTitle: "What's ready",
			done1: "Routing + breadcrumbs",
			done1Desc: "Peaks → Ranges → Range → Peak navigation.",
			done2: "Peak details",
			done2Desc: "Description, coordinates, maps link, info panel.",
			todo1: "Routes",
			todo1Desc: "Add routes tables + peak↔route relations.",
			todo2: "Trailheads",
			todo2Desc: "Trail start points, parking, access + maps links.",
		},
		ua: {
			pill: "PeakGuide",
			hint: "MVP • зручна навігація • швидкі фільтри",
			title: "Корона польських гір і не тільки",
			subtitle:
				"Вершини та хребти в одному місці. Маршрути й стартові точки — далі.",
			peaks: "Вершини",
			peaksDesc: "Список + деталі (опис, мапа, breadcrumbs).",
			ranges: "Хребти",
			rangesDesc: "Список хребтів + сторінка хребта з вершинами.",
			routes: "Маршрути",
			routesDesc: "План: стежки, тривалість, GPX.",
			trailheads: "Стартові точки",
			trailheadsDesc: "План: парковки, старт, доїзд, мапи.",
			soon: "скоро",
			soonTip: "Це буде доступно скоро.",
			goPeaks: "Переглянути вершини",
			goRanges: "Переглянути хребти",
			goRoutes: "Маршрути",
			statusTitle: "Що вже готово",
			done1: "Роутинг + breadcrumbs",
			done1Desc: "Peaks → Ranges → Range → Peak.",
			done2: "Деталі вершини",
			done2Desc: "Опис, координати, посилання на мапу, панель.",
			todo1: "Маршрути",
			todo1Desc: "Додаємо таблиці + звʼязки peak↔route.",
			todo2: "Стартові точки",
			todo2Desc: "Парковки, старт, доїзд + посилання на мапи.",
		},
		zh: {
			pill: "PeakGuide",
			hint: "MVP • 清晰导航 • 快速筛选",
			title: "波兰山峰王冠及更多",
			subtitle: "山峰与山脉已就绪。路线与起点功能下一步上线。",
			peaks: "山峰",
			peaksDesc: "列表 + 详情（介绍、地图、面包屑）。",
			ranges: "山脉",
			rangesDesc: "山脉列表 + 山脉详情（包含山峰）。",
			routes: "路线",
			routesDesc: "计划：线路、用时、GPX。",
			trailheads: "起点",
			trailheadsDesc: "计划：停车、起点、到达方式、地图。",
			soon: "即将",
			soonTip: "该功能即将上线。",
			goPeaks: "浏览山峰",
			goRanges: "浏览山脉",
			goRoutes: "路线",
			statusTitle: "已完成",
			done1: "路由 + 面包屑",
			done1Desc: "Peaks → Ranges → Range → Peak。",
			done2: "山峰详情页",
			done2Desc: "介绍、坐标、地图链接、信息面板。",
			todo1: "路线",
			todo1Desc: "增加路线表 + peak↔route 关系。",
			todo2: "起点",
			todo2Desc: "停车/起点/到达方式 + 地图链接。",
		},
	};

	return dict[lang] || dict.pl;
}

/* Styles */
const wrap = { display: "grid", gap: 14 };

const hero = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 18,
	background:
		"radial-gradient(900px 340px at 20% 0%, rgba(31,122,79,0.18), transparent 60%), radial-gradient(700px 340px at 90% 20%, rgba(217,119,6,0.14), transparent 55%), var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const heroTop = {
	display: "flex",
	justifyContent: "space-between",
	alignItems: "center",
	gap: 10,
	flexWrap: "wrap",
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

const heroHint = { color: "var(--muted)", fontSize: 12, fontWeight: 900 };

const h1 = {
	margin: "10px 0 0",
	fontSize: 34,
	letterSpacing: "-0.8px",
	lineHeight: 1.1,
};
const lead = {
	margin: "10px 0 0",
	color: "var(--muted)",
	maxWidth: 900,
	lineHeight: 1.7,
};

const actions = { display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 };

const actionPrimary = {
	textDecoration: "none",
	fontWeight: 1000,
	padding: "10px 12px",
	borderRadius: 14,
	border: "1px solid rgba(31,122,79,0.30)",
	background: "rgba(31,122,79,0.10)",
	color: "var(--primary)",
	boxShadow: "var(--shadow-soft)",
};

const actionSecondary = {
	textDecoration: "none",
	fontWeight: 1000,
	padding: "10px 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "rgba(255,255,255,0.55)",
	color: "var(--text)",
	boxShadow: "var(--shadow-soft)",
};

const actionGhost = {
	display: "inline-flex",
	alignItems: "center",
	gap: 8,
	padding: "10px 12px",
	borderRadius: 14,
	border: "1px dashed rgba(15,23,42,0.22)",
	background: "rgba(255,255,255,0.45)",
	color: "var(--muted)",
	fontWeight: 1000,
	cursor: "not-allowed",
	userSelect: "none",
};

const grid = {
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
	transition: "transform 140ms ease, box-shadow 140ms ease",
};

const cardTitle = { fontWeight: 1000, letterSpacing: "-0.2px", fontSize: 16 };
const cardDesc = { marginTop: 8, color: "var(--muted)", lineHeight: 1.6 };
const cardMeta = {
	marginTop: 10,
	color: "var(--muted)",
	fontSize: 12,
	fontWeight: 900,
};

const cardDisabled = { opacity: 0.75, cursor: "not-allowed" };

const statusCard = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 16,
	background: "var(--surface)",
	boxShadow: "var(--shadow-soft)",
};

const statusTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
	marginBottom: 12,
};

const statusGrid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
	gap: 12,
};

const statusItem = {
	display: "flex",
	gap: 10,
	alignItems: "flex-start",
	padding: 12,
	borderRadius: 18,
	border: "1px solid rgba(15,23,42,0.10)",
	background: "rgba(255,255,255,0.55)",
};

const statusName = { fontWeight: 1000, letterSpacing: "-0.2px" };
const statusDesc = {
	marginTop: 4,
	color: "var(--muted)",
	fontSize: 13,
	lineHeight: 1.6,
};

const statusDotOk = {
	width: 10,
	height: 10,
	borderRadius: 999,
	background: "rgba(31,122,79,0.90)",
	boxShadow: "0 0 0 4px rgba(31,122,79,0.10)",
	marginTop: 4,
};

const statusDotSoon = {
	width: 10,
	height: 10,
	borderRadius: 999,
	background: "rgba(217,119,6,0.95)",
	boxShadow: "0 0 0 4px rgba(217,119,6,0.10)",
	marginTop: 4,
};

const miniSoon = {
	marginLeft: 8,
	fontSize: 11,
	fontWeight: 1000,
	padding: "4px 8px",
	borderRadius: 999,
	border: "1px solid rgba(217,119,6,0.25)",
	background: "rgba(217,119,6,0.10)",
	color: "rgba(217,119,6,0.95)",
};

const soonPill = {
	fontSize: 11,
	fontWeight: 1000,
	padding: "4px 8px",
	borderRadius: 999,
	border: "1px solid rgba(217,119,6,0.25)",
	background: "rgba(217,119,6,0.10)",
	color: "rgba(217,119,6,0.95)",
};
