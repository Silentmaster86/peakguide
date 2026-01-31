import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchPeaks } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";

const SCROLL_OFFSET = 140; // to match navbar height
export default function HomePage({ lang = "pl" }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	// hash scroll (/#why etc.)
	const { hash } = useLocation();
	useEffect(() => {
		scrollToHash(hash);
	}, [hash]);

	// featured peaks
	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang]);
	const peaks = Array.isArray(peaksState.data) ? peaksState.data : [];
	const featured = useMemo(() => getFeaturedPeaks(peaks, 4), [peaks]);

	return (
		<div style={styles.wrap}>
			<Hero t={t} />

			<Why t={t} />
			<How t={t} />

			<Featured t={t} peaksState={peaksState} featured={featured} />

			<Faq t={t} />
		</div>
	);
}

/* ---------------- helpers ---------------- */

function getNavOffset() {
	const nav = document.getElementById("main-nav");
	return nav ? nav.getBoundingClientRect().height + 12 : 140; // +12 = mały oddech
}

function scrollToHash(hash) {
	if (!hash) return;

	requestAnimationFrame(() => {
		const el = document.querySelector(hash);
		if (!el) return;

		const y = el.getBoundingClientRect().top + window.scrollY - getNavOffset();
		window.scrollTo({ top: y, behavior: "smooth" });
	});
}

function getFeaturedPeaks(peaks, count = 4) {
	const sorted = [...peaks].sort(
		(a, b) => (b.elevation_m || 0) - (a.elevation_m || 0),
	);
	return sorted.slice(0, count);
}

/* ---------------- sections ---------------- */

function Hero({ t }) {
	return (
		<section style={styles.hero} aria-label='Welcome'>
			<div style={styles.kicker}>{t.kicker}</div>
			<h1 style={styles.h1}>{t.title}</h1>

			<p style={styles.lead}>{t.subtitle}</p>
			<p style={styles.para}>{t.p1}</p>
			<p style={styles.para}>{t.p2}</p>
		</section>
	);
}

function Why({ t }) {
	return (
		<Section id='why' title={t.whyTitle} hint={t.whyHint}>
			<div style={styles.cardsGrid}>
				{t.whyCards.map((c) => (
					<div key={c.title} style={styles.infoCard}>
						<div style={styles.infoTitle}>{c.title}</div>
						<div style={styles.infoBody}>{c.body}</div>
					</div>
				))}
			</div>
		</Section>
	);
}

function How({ t }) {
	return (
		<Section id='how' title={t.howTitle} hint={t.howHint}>
			<div style={styles.stepsGrid}>
				{t.steps.map((s) => (
					<div key={s.n} style={styles.stepCard}>
						<div style={styles.stepTop}>
							<div style={styles.stepNum}>{s.n}</div>
							<div style={styles.stepTitle}>{s.title}</div>
						</div>
						<div style={styles.stepBody}>{s.body}</div>
					</div>
				))}
			</div>
		</Section>
	);
}

function Featured({ t, peaksState, featured }) {
	return (
		<Section
			id='featured'
			title={t.featuredTitle}
			right={
				<Link to='/peaks' style={styles.smallLink}>
					{t.seeAll} →
				</Link>
			}
			ariaLabel='Featured peaks'
		>
			{peaksState.status === "loading" ? (
				<div style={styles.cardsGrid4}>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={`sk-${i}`}
							style={{ ...styles.peakCard, ...styles.cardSkeleton }}
						/>
					))}
				</div>
			) : peaksState.status === "error" ? (
				<div style={styles.noticeWarn}>
					<div style={{ fontWeight: 1000 }}>{t.featuredErrorTitle}</div>
					<div style={{ opacity: 0.85, marginTop: 6 }}>
						{String(peaksState.error || t.featuredErrorBody)}
					</div>
				</div>
			) : featured.length === 0 ? (
				<div style={styles.notice}>{t.featuredEmpty}</div>
			) : (
				<div style={styles.cardsGrid4}>
					{featured.map((p) => (
						<Link key={p.slug} to={`/peaks/${p.slug}`} style={styles.cardLink}>
							<article style={styles.peakCard}>
								<div style={styles.peakTop}>
									<div style={{ minWidth: 0 }}>
										<div style={styles.peakTitle} title={p.peak_name || p.name}>
											{p.peak_name || p.name}
										</div>
										<div style={styles.peakSub}>{p.range_name || "—"}</div>
									</div>
									<div style={styles.elevBadge}>{p.elevation_m} m</div>
								</div>

								<div style={styles.peakBottom}>
									<span style={styles.micro}>{t.openDetails}</span>
									<span style={styles.arrow}>→</span>
								</div>
							</article>
						</Link>
					))}
				</div>
			)}
		</Section>
	);
}

function Faq({ t }) {
	return (
		<Section id='faq' title={t.faqTitle} hint={t.faqHint} ariaLabel='FAQ'>
			<div style={styles.faqGrid}>
				{t.faq.map((q) => (
					<div key={q.q} style={styles.faqItem}>
						<div style={styles.faqQ}>{q.q}</div>
						<div style={styles.faqA}>{q.a}</div>
					</div>
				))}
			</div>
		</Section>
	);
}

function Section({ id, title, hint, right, ariaLabel, children }) {
	return (
		<section
			id={id}
			style={{ ...styles.panel, scrollMarginTop: SCROLL_OFFSET }}
			aria-label={ariaLabel || title}
		>
			<div style={styles.headRow}>
				<div
					style={{
						display: "flex",
						alignItems: "baseline",
						gap: 10,
						flexWrap: "wrap",
					}}
				>
					<h2 style={styles.h2}>{title}</h2>
					{hint ? <span style={styles.microMuted}>{hint}</span> : null}
				</div>
				{right || null}
			</div>
			{children}
		</section>
	);
}

/* ---------------- labels ---------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			kicker: "Witaj",
			title: "PeakGuide",
			subtitle:
				"Przewodnik po Koronie Gór Polski, który ma być po prostu użyteczny: szybko znajdziesz szczyt, sprawdzisz pasmo i wejdziesz w detale.",
			p1: "Na górze masz nawigację do listy szczytów i pasm. Tam możesz przeglądać, filtrować i wybierać kolejne miejsca.",
			p2: "Projekt będzie rozwijany o praktyczne informacje (start, dojazd, parking, wskazówki) — bez zbędnych ozdobników.",

			whyTitle: "Dlaczego PeakGuide",
			whyHint: "po co ta strona istnieje",
			whyCards: [
				{
					title: "Szybko i czytelnie",
					body: "Minimum chaosu. Najważniejsze informacje pod ręką.",
				},
				{
					title: "Realny przewodnik",
					body: "Ma pomagać w planowaniu wyjść, a nie tylko wyglądać.",
				},
				{
					title: "Rozwój w stronę praktyki",
					body: "Start/dojazd, parking, tipy i linki do map.",
				},
			],

			howTitle: "Jak to działa",
			howHint: "3 proste kroki",
			steps: [
				{
					n: "1",
					title: "Wybierz szczyt",
					body: "Wejdź w listę i kliknij kartę szczytu.",
				},
				{
					n: "2",
					title: "Sprawdź detale",
					body: "Zobacz pasmo, wysokość i kluczowe informacje.",
				},
				{
					n: "3",
					title: "Zaplanuj wyjście",
					body: "W kolejnych wersjach: start, dojazd i parking.",
				},
			],

			featuredTitle: "Polecane",
			seeAll: "Zobacz wszystkie",
			openDetails: "Otwórz szczegóły",
			featuredEmpty: "Brak danych — dodaj szczyty do bazy lub uruchom API.",
			featuredErrorTitle: "Nie udało się pobrać szczytów",
			featuredErrorBody: "Sprawdź API / proxy w Vite.",

			faqTitle: "FAQ",
			faqHint: "krótkie odpowiedzi",
			faq: [
				{
					q: "Czy to tylko Korona Gór Polski?",
					a: "Na start tak — potem można rozszerzać bazę.",
				},
				{
					q: "Czy będą trasy i GPX?",
					a: "Tak — najpierw start/parking/linki, potem GPX.",
				},
				{
					q: "Skąd pochodzą dane?",
					a: "Baza jest rozwijana i będzie uzupełniana o źródła/linki.",
				},
				{
					q: "Czy będzie „Ulubione”?",
					a: "Tak — najpierw lokalnie, potem konto / synchronizacja.",
				},
			],
		},

		// możesz dopiąć EN/UA/ZH później (albo skopiować z Twoich wersji 1:1)
	};

	return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

const styles = {
	wrap: { display: "grid", gap: 14 },

	hero: {
		border: "1px solid var(--border)",
		borderRadius: 22,
		padding: 16,
		background: "rgb(255 255 255 / 70%)",
		boxShadow: "var(--shadow-soft)",
	},

	kicker: {
		fontSize: 12,
		fontWeight: 950,
		opacity: 0.8,
		letterSpacing: "0.2px",
		textTransform: "uppercase",
	},

	h1: {
		margin: "6px 0 0",
		fontSize: 26,
		letterSpacing: "-0.7px",
		lineHeight: 1.1,
	},
	lead: { margin: "10px 0 0", opacity: 0.88, lineHeight: 1.7, maxWidth: 900 },
	para: { margin: "10px 0 0", opacity: 0.82, lineHeight: 1.7, maxWidth: 900 },

	panel: {
		border: "1px solid var(--border)",
		borderRadius: 22,
		padding: 16,
		background: "rgba(255,255,255,0.70)",
		boxShadow: "var(--shadow-soft)",
	},

	headRow: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "baseline",
		gap: 10,
		flexWrap: "wrap",
		marginBottom: 10,
	},

	h2: { margin: 0, fontSize: 16, letterSpacing: "-0.2px" },
	microMuted: { opacity: 0.7, fontSize: 12, fontWeight: 900 },

	cardsGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
		gap: 12,
	},

	infoCard: {
		border: "1px solid rgba(15,23,42,0.10)",
		borderRadius: 18,
		padding: 14,
		background: "var(--surface-2)",
		boxShadow: "var(--shadow-soft)",
	},
	infoTitle: { fontWeight: 1100, letterSpacing: "-0.2px" },
	infoBody: { marginTop: 8, opacity: 0.82, lineHeight: 1.65 },

	stepsGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
		gap: 12,
	},

	stepCard: {
		border: "1px solid rgba(15,23,42,0.10)",
		borderRadius: 18,
		padding: 14,
		background: "var(--surface-2)",
		boxShadow: "var(--shadow-soft)",
	},

	stepTop: { display: "flex", alignItems: "center", gap: 10 },
	stepNum: {
		width: 28,
		height: 28,
		borderRadius: 10,
		display: "grid",
		placeItems: "center",
		fontWeight: 1100,
		border: "1px solid rgba(31,122,79,0.18)",
		background: "rgba(31,122,79,0.06)",
		color: "var(--primary)",
	},
	stepTitle: { fontWeight: 1100, letterSpacing: "-0.2px" },
	stepBody: { marginTop: 10, opacity: 0.82, lineHeight: 1.65 },

	cardsGrid4: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
		gap: 12,
	},

	cardLink: { textDecoration: "none", color: "inherit" },

	peakCard: {
		border: "1px solid rgba(15,23,42,0.10)",
		borderRadius: 18,
		padding: 14,
		background: "var(--surface-2)",
		boxShadow: "var(--shadow-soft)",
	},

	peakTop: {
		display: "flex",
		justifyContent: "space-between",
		gap: 12,
		alignItems: "flex-start",
	},
	peakTitle: {
		fontWeight: 1100,
		letterSpacing: "-0.2px",
		fontSize: 16,
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
	},
	peakSub: { marginTop: 6, opacity: 0.75, fontSize: 13 },

	elevBadge: {
		border: "1px solid rgba(31,122,79,0.22)",
		borderRadius: 999,
		padding: "7px 10px",
		fontWeight: 1000,
		fontSize: 13,
		whiteSpace: "nowrap",
		color: "var(--primary)",
		background: "rgba(31,122,79,0.08)",
	},

	peakBottom: {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		marginTop: 12,
	},
	micro: { opacity: 0.7, fontSize: 12, fontWeight: 900 },
	arrow: { fontWeight: 1100, opacity: 0.85 },

	smallLink: {
		textDecoration: "none",
		fontWeight: 1000,
		color: "var(--primary)",
		borderBottom: "1px dashed rgba(31,122,79,0.55)",
	},

	cardSkeleton: {
		height: 110,
		background:
			"linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)",
		backgroundSize: "200% 100%",
		animation: "shimmer 1.2s infinite",
	},

	notice: {
		border: "1px solid var(--border)",
		borderRadius: 18,
		padding: 14,
		background: "rgba(15,23,42,0.03)",
		opacity: 0.85,
		fontWeight: 900,
	},

	noticeWarn: {
		border: "1px solid rgba(185,28,28,0.25)",
		borderRadius: 18,
		padding: 14,
		background: "rgba(185,28,28,0.06)",
	},

	faqGrid: { display: "grid", gap: 12 },
	faqItem: {
		border: "1px solid rgba(15,23,42,0.10)",
		borderRadius: 18,
		padding: 14,
		background: "var(--surface-2)",
		boxShadow: "var(--shadow-soft)",
	},
	faqQ: { fontWeight: 1100, letterSpacing: "-0.2px" },
	faqA: { marginTop: 8, opacity: 0.82, lineHeight: 1.65 },
};
