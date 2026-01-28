import { useMemo } from "react";

/**
 * AboutPage
 * - Product-focused (no tech stack talk)
 * - Short, friendly, useful
 * - Supports PL / EN / UA / ZH
 */

export default function AboutPage({ lang = "pl" }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	return (
		<div style={wrap}>
			<section style={card} aria-label='About PeakGuide'>
				<div style={kicker}>{t.kicker}</div>
				<h1 style={title}>{t.title}</h1>

				<p style={lead}>{t.lead}</p>

				<div style={grid}>
					<div style={box}>
						<div style={boxTitle}>{t.b1Title}</div>
						<p style={p}>{t.b1Body}</p>
					</div>

					<div style={box}>
						<div style={boxTitle}>{t.b2Title}</div>
						<p style={p}>{t.b2Body}</p>
					</div>

					<div style={box}>
						<div style={boxTitle}>{t.b3Title}</div>
						<p style={p}>{t.b3Body}</p>
					</div>
				</div>

				<div style={note}>
					<div style={noteTitle}>{t.noteTitle}</div>
					<div style={noteBody}>{t.noteBody}</div>
				</div>
			</section>
		</div>
	);
}

/* ----------------------------- labels ----------------------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			kicker: "O projekcie",
			title: "PeakGuide",
			lead: "PeakGuide to prosty przewodnik po Koronie Gór Polski — ma pomagać szybko znaleźć miejsce, wejść w szczegóły i planować wyjście w góry bez zbędnego szukania.",
			b1Title: "Co tu znajdziesz",
			b1Body:
				"Listę szczytów i pasm oraz czytelne strony szczegółów. Z czasem dojdą bardziej praktyczne informacje, żeby strona była realnym narzędziem.",
			b2Title: "Dla kogo",
			b2Body:
				"Dla osób, które chcą sprawdzić podstawy przed wyjazdem: co to za szczyt, w jakim paśmie jest i gdzie zacząć szukanie informacji do planu.",
			b3Title: "Kierunek rozwoju",
			b3Body:
				"Więcej praktyki: start/dojazd, parking, wskazówki, linki do map i źródeł. Docelowo także ulubione i personalizacja.",
			noteTitle: "Masz sugestię?",
			noteBody:
				"Jeśli brakuje Ci konkretnej informacji na stronach szczytów — to najlepszy typ feedbacku. Taki przewodnik ma być użyteczny.",
		},
		en: {
			kicker: "About",
			title: "PeakGuide",
			lead: "PeakGuide is a simple guide to the Crown of Polish Mountains — built to help you find a place fast, open clear details, and plan a trip without endless searching.",
			b1Title: "What you’ll find",
			b1Body:
				"A list of peaks and ranges with clean detail pages. Over time, more practical info will be added so it becomes a real tool.",
			b2Title: "Who it’s for",
			b2Body:
				"For anyone who wants the basics before a hike: what the peak is, which range it belongs to, and where to start planning.",
			b3Title: "Where it’s going",
			b3Body:
				"More practicality: trail start/access, parking, tips, map links and sources. Later: favourites and personalisation.",
			noteTitle: "Got a suggestion?",
			noteBody:
				"If you’re missing a specific detail on peak pages — that’s the best kind of feedback. A guide should be useful.",
		},
		ua: {
			kicker: "Про проєкт",
			title: "PeakGuide",
			lead: "PeakGuide — простий путівник по Короні польських гір. Він допомагає швидко знайти місце, відкрити деталі та планувати похід без зайвих пошуків.",
			b1Title: "Що тут є",
			b1Body:
				"Список вершин і хребтів та чіткі сторінки деталей. З часом додамо більше практичної інформації, щоб це був реальний інструмент.",
			b2Title: "Для кого",
			b2Body:
				"Для тих, хто хоче базову інформацію перед походом: що це за вершина, до якого хребта належить і з чого почати планування.",
			b3Title: "Куди розвивається",
			b3Body:
				"Більше практики: старт/доїзд, паркінг, поради, посилання на мапи та джерела. Потім — улюблене й персоналізація.",
			noteTitle: "Є пропозиція?",
			noteBody:
				"Якщо на сторінках вершин бракує конкретної інформації — це найкращий фідбек. Путівник має бути корисним.",
		},
		zh: {
			kicker: "关于",
			title: "PeakGuide",
			lead: "PeakGuide 是一个简洁的波兰山峰王冠指南：帮助你快速找到目标、查看清晰详情，并更轻松地规划行程。",
			b1Title: "你能找到什么",
			b1Body:
				"山峰与山脉列表，以及清晰的详情页。后续会逐步加入更实用的信息，让它成为真正的工具。",
			b2Title: "适合谁",
			b2Body:
				"适合想在出发前了解基础信息的人：这座山峰是什么、属于哪个山脉，以及从哪里开始规划。",
			b3Title: "未来方向",
			b3Body:
				"更实用：起点/到达方式、停车、提示、地图链接与来源。之后加入收藏与个性化。",
			noteTitle: "有建议吗？",
			noteBody:
				"如果你在山峰详情页缺少某个具体信息——这类反馈最有价值。指南就该好用。",
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ----------------------------- */

const wrap = { display: "grid", gap: 14 };

const card = {
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
	maxWidth: 940,
};

const grid = {
	marginTop: 14,
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
	gap: 12,
};

const box = {
	border: "1px solid rgba(15,23,42,0.10)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(255,255,255,0.55)",
	boxShadow: "var(--shadow-soft)",
};

const boxTitle = { fontWeight: 1100, letterSpacing: "-0.2px" };

const p = {
	margin: "8px 0 0",
	opacity: 0.82,
	lineHeight: 1.65,
};

const note = {
	marginTop: 14,
	border: "1px solid rgba(31,122,79,0.18)",
	borderRadius: 18,
	padding: 14,
	background: "rgba(31,122,79,0.06)",
};

const noteTitle = { fontWeight: 1100, letterSpacing: "-0.2px" };
const noteBody = { marginTop: 6, opacity: 0.85, lineHeight: 1.6 };
