import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchPeaks, fetchTrails } from '../api/peakguide';
import { useAsync } from '../hooks/useAsync';

export default function HomePage({ lang = 'pl' }) {
	const t = useMemo(() => getLabels(lang), [lang]);

	// hash scroll (/#why etc.)
	const { hash } = useLocation();
	useEffect(() => {
		scrollToHash(hash);
	}, [hash]);

	// featured peaks
	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang]);
	// featured trails
	const trailsState = useAsync(() => fetchTrails({ lang }), [lang]);

	// keep a stable "peaks" array derived from async state
	const peaks = useMemo(() => {
		return Array.isArray(peaksState?.data) ? peaksState.data : [];
	}, [peaksState]);

	// featured countries
	const countriesCount = useMemo(() => {
		const countries = new Set(
			peaks.map((peak) => peak.country_slug).filter(Boolean),
		);

		return countries.size;
	}, [peaks]);

	const countries = useMemo(() => {
		const grouped = new Map();

		peaks.forEach((peak) => {
			if (!peak.country_slug) return;

			if (!grouped.has(peak.country_slug)) {
				grouped.set(peak.country_slug, {
					slug: peak.country_slug,
					name: peak.country_name,
					peaksCount: 0,
					ranges: new Set(),
				});
			}

			const country = grouped.get(peak.country_slug);

			country.peaksCount += 1;

			if (peak.range_slug) {
				country.ranges.add(peak.range_slug);
			}
		});

		return Array.from(grouped.values()).map((country) => ({
			...country,
			rangesCount: country.ranges.size,
		}));
	}, [peaks]);

	// compute featured peaks in a memo-safe way (no eslint deps warning)
	const featured = useMemo(() => {
		return getFeaturedPeaks(peaks, 4);
	}, [peaks]);

	return (
		<div style={styles.wrap}>
			<Hero
				t={t}
				peaksCount={peaks.length}
				trailsCount={
					Array.isArray(trailsState?.data) ? trailsState.data.length : 0
				}
				countriesCount={countriesCount}
			/>

			<ExploreCountries countries={countries} t={t} />

			<Why t={t} />
			<How t={t} />

			<Featured t={t} peaksState={peaksState} featured={featured} />

			<Faq t={t} />
		</div>
	);
}

/* ---------------- helpers ---------------- */

function getNavOffset() {
	const nav = document.getElementById('main-nav');
	return nav ? nav.getBoundingClientRect().height + 12 : 140; // +12 = small breathing room
}

function scrollToHash(hash) {
	if (!hash) return;

	requestAnimationFrame(() => {
		const el = document.querySelector(hash);
		if (!el) return;

		const y = el.getBoundingClientRect().top + window.scrollY - getNavOffset();
		window.scrollTo({ top: y, behavior: 'smooth' });
	});
}

function getFeaturedPeaks(peaks, count = 4) {
	const byCountry = new Map();

	peaks.forEach((peak) => {
		if (!peak.country_slug) return;

		if (!byCountry.has(peak.country_slug)) {
			byCountry.set(peak.country_slug, []);
		}

		byCountry.get(peak.country_slug).push(peak);
	});

	const countryPeaks = Array.from(byCountry.values()).map((countryPeaks) =>
		[...countryPeaks].sort(
			(a, b) => (b.elevation_m || 0) - (a.elevation_m || 0),
		),
	);

	const featured = [];
	let index = 0;

	while (featured.length < count) {
		let added = false;

		for (const peaks of countryPeaks) {
			if (peaks[index]) {
				featured.push(peaks[index]);
				added = true;

				if (featured.length === count) {
					break;
				}
			}
		}

		if (!added) break;

		index += 1;
	}

	return featured;
}

/* ---------------- sections ---------------- */

function Hero({ t, peaksCount, trailsCount, countriesCount }) {
	return (
		<section style={styles.hero} aria-label='Welcome'>
			<div style={styles.kicker}>{t.kicker}</div>

			<h1 style={styles.h1}>{t.title}</h1>

			<p style={styles.lead}>{t.subtitle}</p>

			<div style={styles.heroActions}>
				<Link to='/peaks' style={styles.primaryCta}>
					{t.explorePeaks}
					<span aria-hidden='true'> →</span>
				</Link>{' '}
				<Link to='/trails' style={styles.secondaryCta}>
					{t.exploreTrails}
					<span aria-hidden='true'> →</span>
				</Link>
			</div>

			<div style={styles.heroStats}>
				<div style={styles.heroStat}>
					<strong style={styles.heroStatValue}>{peaksCount}</strong>
					<span style={styles.heroStatLabel}>{t.peaksLabel}</span>
				</div>

				<div style={styles.heroStat}>
					<strong style={styles.heroStatValue}>{trailsCount}</strong>
					<span style={styles.heroStatLabel}>{t.trailsLabel}</span>
				</div>

				<div style={styles.heroStat}>
					<strong style={styles.heroStatValue}>{countriesCount}</strong>
					<span style={styles.heroStatLabel}>{t.countriesLabel}</span>
				</div>
			</div>
		</section>
	);
}

const countryFlags = {
	poland: '🇵🇱',
	'united-kingdom': '🇬🇧',
};

function ExploreCountries({ countries, t}) {
	return (
		<section style={styles.section}>
			<div style={styles.sectionHead}>
				<div>
					<h2 style={styles.sectionTitle}>{t.countriesTitle}</h2>
					<p style={styles.sectionSubtitle}>
						{t.countriesSubtitle}
					</p>
				</div>
			</div>

			<div style={styles.countryGrid}>
				{countries.map((country) => (
					<Link
						key={country.slug}
						to={`/peaks?country=${country.slug}`}
						style={styles.countryCard}
					>
						<strong>
							{countryFlags[country.slug] ?? '🏔️'} {country.name}
						</strong>

						<div>
							{country.peaksCount} {t.countryPeaks} · {country.rangesCount} {' '}
							{t.countryRanges}
						</div>

						<span style={{ color: 'var(--primary)', fontWeight: 800 }}>
							{t.exploreCountry} →
						</span>
					</Link>
				))}
			</div>
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
	const isLoading = peaksState?.status === 'loading';
	const isError = peaksState?.status === 'error';
	const hasFeatured = Array.isArray(featured) && featured.length > 0;

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
			{isLoading ? (
				<FeaturedSkeleton />
			) : isError ? (
				<FeaturedError t={t} error={peaksState?.error} />
			) : !hasFeatured ? (
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
										<div style={styles.peakSub}>
											{p.country_name || '-'} • {p.range_name || '—'}

										</div>
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

function FeaturedSkeleton() {
	return (
		<div style={styles.cardsGrid4}>
			{Array.from({ length: 4 }).map((_, i) => (
				<div
					key={`sk-${i}`}
					style={{ ...styles.peakCard, ...styles.cardSkeleton }}
				/>
			))}
		</div>
	);
}

function FeaturedError({ t, error }) {
	return (
		<div style={styles.noticeWarn}>
			<div style={{ fontWeight: 1000 }}>{t.featuredErrorTitle}</div>
			<div style={{ opacity: 0.85, marginTop: 6 }}>
				{String(error || t.featuredErrorBody)}
			</div>
		</div>
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
	// dynamic scroll margin – matches your navbar height (better than constant)
	const scrollMarginTop = getNavOffset();

	return (
		<section
			id={id}
			style={{ ...styles.panel, scrollMarginTop }}
			aria-label={ariaLabel || title}
		>
			<div style={styles.headRow}>
				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: 10,
						flexWrap: 'wrap',
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
			explorePeaks: 'Odkrywaj szczyty',
			exploreTrails: 'Odkrywaj trasy',
			peaksLabel: 'Szczyty',
			trailsLabel: 'Trasy',
			countriesLabel: 'Kraje',

			countriesTitle: 'Odkrywaj według kraju',
			countriesSubtitle:
				'Poznawaj góry, szczyty i trasy w różnych częściach świata.',
			countryPeaks: 'szczytów',
			countryRanges: 'pasm',
			exploreCountry: 'Odkrywaj',

			kicker: 'Eksploruj • Zdobywaj • Odkrywaj',
			title: 'Znajdź swoją następną górską przygodę',
			subtitle:
				'Odkrywaj szczyty, szlaki i praktyczne informacje górskie w całej Europie i nie tylko.',

			whyTitle: 'Dlaczego PeakGuide',
			whyHint: 'po co ta strona istnieje',
			whyCards: [
				{
					title: 'Szybko i czytelnie',
					body: 'Najważniejsze informacje o szczytach i trasach w jednym miejscu.',
				},
				{
					title: 'Praktyczne planowanie',
					body: 'Trasy, punkty startowe, parking, dostęp i informacje przydatne przed wyjściem.',
				},
				{
					title: 'Jedna rosnąca baza',
					body: 'Kolejne kraje, regiony, szczyty i trasy będą stopniowo dodawane do PeakGuide.',
				},
			],

			howTitle: 'Jak to działa',
			howHint: '3 proste kroki',
			steps: [
				{
					n: '1',
					title: 'Odkrywaj',
					body: 'Przeglądaj kraje, pasma, szczyty i dostępne trasy.',
				},
				{
					n: '2',
					title: 'Sprawdź szczegóły',
					body: 'Poznaj wysokość, położenie, trasę i dostępne informacje praktyczne.',
				},
				{
					n: '3',
					title: 'Zaplanuj wyjście',
					body: 'Wykorzystaj informacje o trasie, starcie, dostępie i parkingu podczas planowania.',
				},
			],

			featuredTitle: 'Polecane',
			seeAll: 'Zobacz wszystkie',
			openDetails: 'Otwórz szczegóły',
			featuredEmpty: 'Brak danych — dodaj szczyty do bazy lub uruchom API.',
			featuredErrorTitle: 'Nie udało się pobrać szczytów',
			featuredErrorBody: 'Sprawdź API / proxy w Vite.',
			faqTitle: 'FAQ',
			faqHint: 'krótkie odpowiedzi',
			faq: [
				{
					q: 'Jakie kraje obejmuje PeakGuide?',
					a: 'Obecnie baza obejmuje Polskę i Wielką Brytanię. W planach są kolejne kraje i regiony.',
				},
				{
					q: 'Czy PeakGuide zawiera trasy?',
					a: 'Tak. Dostępne trasy mogą zawierać dystans, przewyższenie, czas przejścia, poziom trudności oraz informacje praktyczne.',
				},
				{
					q: 'Skąd pochodzą dane?',
					a: 'Dane są gromadzone i rozwijane na podstawie sprawdzanych źródeł. Projekt będzie również rozwijany o dokładniejsze informacje o źródłach i aktualności danych.',
				},
				{
					q: 'Czy będą dodawane nowe funkcje?',
					a: 'Tak. Planowany jest dalszy rozwój map, pogody, danych terenowych, punktów POI, kolekcji i funkcji użytkownika.',
				},
			],
		},

		en: {
			explorePeaks: 'Explore Peaks',
			exploreTrails: 'Explore Trails',
			peaksLabel: 'Peaks',
			trailsLabel: 'Trails',
			countriesLabel: 'Countries',

			countriesTitle: 'Explore by country',
			countriesSubtitle:
				'Discover mountains, peaks and trails across different parts of the world.',
			countryPeaks: 'peaks',
			countryRanges: 'ranges',
			exploreCountry: 'Explore',

			kicker: 'EXPLORE • CLIMB • DISCOVER',
			title: 'Find your next mountain adventure',
			subtitle:
				'Discover peaks, hiking trails and practical mountain information across Europe and beyond.',

			whyTitle: 'Why PeakGuide',
			whyHint: 'the purpose of this site',
			whyCards: [
				{
					title: 'Fast and clear',
					body: 'The most important information about peaks and trails in one place.',
				},
				{
					title: 'Practical planning',
					body: 'Trails, start points, parking, access and useful information before your outing.',
				},
				{
					title: 'One growing database',
					body: 'More countries, regions, peaks and trails will gradually be added to PeakGuide.',
				},
			],

			featuredTitle: 'Featured',
			seeAll: 'See all',
			openDetails: 'Open details',
			featuredEmpty: 'No data — add peaks to the database or start the API.',
			featuredErrorTitle: 'Failed to fetch peaks',
			featuredErrorBody: 'Check the API / proxy in Vite.',
			howTitle: 'How it works',
			howHint: '3 simple steps',
			steps: [
				{
					n: '1',
					title: 'Explore',
					body: 'Browse countries, mountain ranges, peaks and available trails.',
				},
				{
					n: '2',
					title: 'Check the details',
					body: 'See elevation, location, trail information and available practical details.',
				},
				{
					n: '3',
					title: 'Plan your outing',
					body: 'Use trail, start point, access and parking information to help plan your adventure.',
				},
			],

			faqTitle: 'FAQ',
			faqHint: 'brief answers',
			faq: [
				{
					q: 'Which countries does PeakGuide cover?',
					a: 'The database currently covers Poland and the United Kingdom, with more countries and regions planned.',
				},
				{
					q: 'Does PeakGuide include hiking trails?',
					a: 'Yes. Available trails can include distance, elevation gain, estimated time, difficulty and practical information.',
				},
				{
					q: 'Where does the data come from?',
					a: 'Data is collected and developed using verified sources. The project will also provide clearer information about sources and data freshness.',
				},
				{
					q: 'Are more features planned?',
					a: 'Yes. Future development includes maps, weather, terrain data, POIs, collections and user features.',
				},
			],
		},

		ua: {
			explorePeaks: 'Досліджувати вершини',
			exploreTrails: 'Досліджувати маршрути',
			peaksLabel: 'Вершини',
			trailsLabel: 'Маршрути',
			countriesLabel: 'Країни',

			countriesTitle: 'Досліджуйте за країною',
			countriesSubtitle:
				'Відкривайте гори, вершини та маршрути в різних куточках світу.',
			countryPeaks: 'вершин',
			countryRanges: 'гірських масивів',
			exploreCountry: 'Досліджувати',

			kicker: 'ДОСЛІДЖУЙ • ПІДКОРЮЙ • ВІДКРИВАЙ',
			title: 'Знайди свою наступну гірську пригоду',
			subtitle:
				'Відкривай вершини, туристичні маршрути та практичну інформацію про гори в Європі та за її межами.',

			whyTitle: 'Чому PeakGuide',
			whyHint: 'мета цього сайту',
			whyCards: [
				{
					title: 'Швидко і зрозуміло',
					body: 'Найважливіша інформація про вершини та маршрути в одному місці.',
				},
				{
					title: 'Практичне планування',
					body: 'Маршрути, точки старту, паркування, доступ та корисна інформація перед походом.',
				},
				{
					title: 'Єдина база, що зростає',
					body: 'До PeakGuide поступово додаватимуться нові країни, регіони, вершини та маршрути.',
				},
			],

			featuredTitle: 'Рекомендовані',
			seeAll: 'Переглянути всі',
			openDetails: 'Відкрити деталі',
			featuredEmpty:
				'Немає даних — додайте вершини до бази даних або запустіть API.',
			featuredErrorTitle: 'Не вдалося отримати вершини',
			featuredErrorBody: 'Перевірте API / проксі у Vite.',
			howTitle: 'Як це працює',
			howHint: '3 прості кроки',
			steps: [
				{
					n: '1',
					title: 'Досліджуйте',
					body: 'Переглядайте країни, гірські хребти, вершини та доступні маршрути.',
				},
				{
					n: '2',
					title: 'Перевірте деталі',
					body: 'Перегляньте висоту, розташування, маршрут і доступну практичну інформацію.',
				},
				{
					n: '3',
					title: 'Сплануйте похід',
					body: 'Використовуйте інформацію про маршрут, точку старту, доступ і паркування для планування.',
				},
			],

			faqTitle: 'FAQ',
			faqHint: 'короткі відповіді',
			faq: [
				{
					q: 'Які країни охоплює PeakGuide?',
					a: 'Наразі база охоплює Польщу та Велику Британію. У майбутньому планується додавання нових країн і регіонів.',
				},
				{
					q: 'Чи містить PeakGuide туристичні маршрути?',
					a: 'Так. Доступні маршрути можуть містити відстань, набір висоти, орієнтовний час, рівень складності та практичну інформацію.',
				},
				{
					q: 'Звідки походять дані?',
					a: 'Дані збираються та розвиваються на основі перевірених джерел. Також планується чіткіше відображення джерел та актуальності даних.',
				},
				{
					q: 'Чи плануються нові функції?',
					a: 'Так. Планується подальший розвиток карт, погоди, даних про рельєф, POI, колекцій і функцій користувача.',
				},
			],
		},
		zh: {
			explorePeaks: '探索山峰',
			exploreTrails: '探索路线',
			peaksLabel: '山峰',
			trailsLabel: '路线',
			countriesLabel: '国家',

			countriesTitle: '按国家探索',
			countriesSubtitle: '探索世界不同地区的山脉、山峰和徒步路线。',
			countryPeaks: '座山峰',
			countryRanges: '个山脉',
			exploreCountry: '探索',

			kicker: '探索 • 攀登 • 发现',
			title: '寻找你的下一次山地探险',
			subtitle: '探索欧洲及世界各地的山峰、徒步路线和实用山地信息。',

			whyTitle: '为什么选择 PeakGuide',
			whyHint: '本网站的目的',
			whyCards: [
				{
					title: '快速且清晰',
					body: '在一个地方查看有关山峰和路线的最重要信息。',
				},
				{
					title: '实用的行程规划',
					body: '提供路线、起点、停车、通行方式以及出发前需要了解的实用信息。',
				},
				{
					title: '不断扩展的数据库',
					body: 'PeakGuide 将逐步加入更多国家、地区、山峰和徒步路线。',
				},
			],

			featuredTitle: '精选推荐',
			seeAll: '查看全部',
			openDetails: '打开详情',
			featuredEmpty: '无数据——将山峰添加到数据库或启动 API。',
			featuredErrorTitle: '获取山峰失败',
			featuredErrorBody: '检查 Vite 中的 API / 代理。',
			howTitle: '如何使用',
			howHint: '3 个简单步骤',
			steps: [
				{
					n: '1',
					title: '探索',
					body: '浏览国家、山脉、山峰和可用的徒步路线。',
				},
				{
					n: '2',
					title: '查看详情',
					body: '查看海拔、位置、路线以及可用的实用信息。',
				},
				{
					n: '3',
					title: '规划行程',
					body: '利用路线、起点、通行方式和停车信息规划您的山地行程。',
				},
			],

			faqTitle: '常见问题',
			faqHint: '简短回答',
			faq: [
				{
					q: 'PeakGuide 目前覆盖哪些国家？',
					a: '目前数据库包括波兰和英国，未来计划加入更多国家和地区。',
				},
				{
					q: 'PeakGuide 是否包含徒步路线？',
					a: '是的。可用路线可以包含距离、累计爬升、预计时间、难度和实用信息。',
				},
				{
					q: '数据来自哪里？',
					a: '数据基于经过核实的来源进行收集和完善。项目还将进一步提供更清晰的数据来源和更新时间信息。',
				},
				{
					q: '未来还会增加新功能吗？',
					a: '会。未来计划继续开发地图、天气、地形数据、POI、路线集合以及用户功能。',
				},
			],
		},
	};

	return dict[lang] || dict.pl;
}

/* ---------------- styles ---------------- */

const styles = {
	wrap: { display: 'grid', gap: 14 },

	hero: {
		border: '1px solid color-mix(in srgb, var(--primary) 12%, var(--border))',
		borderRadius: 22,
		padding: 16,
		background: 'var(--surface)',
		color: 'var(--text)',
		boxShadow: 'var(--shadow-soft)',
	},

	heroActions: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: 10,
		marginTop: 18,
	},

	primaryCta: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 8,
		padding: '10px 16px',
		borderRadius: 10,
		background: 'var(--primary)',
		color: '#06130d',
		fontWeight: 800,
		textDecoration: 'none',
	},

	secondaryCta: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: 8,
		padding: '10px 16px',
		borderRadius: 10,
		border: '1px solid var(--border)',
		color: 'var(--text)',
		fontWeight: 800,
		textDecoration: 'none',
	},

	heroStats: {
		display: 'flex',
		alignItems: 'stretch',
		gap: 10,
		marginTop: 20,
		flexWrap: 'wrap',
	},

	heroStat: {
		display: 'flex',
		flexDirection: 'column',
		minWidth: 100,
		padding: '10px 14px',
		border: '1px solid var(--border)',
		borderRadius: 10,
		background: 'var(--pill-bg)',
	},

	heroStatValue: {
		fontSize: 20,
		lineHeight: 1,
		color: 'var(--primary)',
	},

	heroStatLabel: {
		marginTop: 5,
		fontSize: 12,
		color: 'var(--muted)',
		fontWeight: 700,
	},

	kicker: {
		fontSize: 12,
		fontWeight: 950,
		opacity: 0.8,
		letterSpacing: '0.2px',
		textTransform: 'uppercase',
	},

	h1: {
		margin: '6px 0 0',
		fontSize: 26,
		letterSpacing: '-0.7px',
		lineHeight: 1.1,
	},

	lead: {
		margin: '10px 0 0',
		color: 'var(--muted)',
		lineHeight: 1.7,
		maxWidth: 900,
	},

	para: {
		margin: '10px 0 0',
		color: 'var(--muted)',
		lineHeight: 1.7,
		maxWidth: 900,
	},

	panel: {
		border: '1px solid color-mix(in srgb, var(--primary) 12%, var(--border))',
		borderRadius: 22,
		padding: 16,
		background: 'var(--surface)',
		color: 'var(--text)',
		boxShadow: 'var(--shadow-soft)',
	},

	headRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'baseline',
		gap: 10,
		flexWrap: 'wrap',
		marginBottom: 10,
	},

	h2: {
		margin: 0,
		fontSize: 16,
		letterSpacing: '-0.2px',
	},

	microMuted: {
		opacity: 0.7,
		fontSize: 12,
		fontWeight: 900,
	},

	cardsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		gap: 12,
	},

	infoCard: {
		border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
		borderRadius: 18,
		padding: 14,
		background: 'var(--surface-2)',
		boxShadow: 'var(--shadow-soft)',
	},

	infoTitle: {
		fontWeight: 1100,
		letterSpacing: '-0.2px',
	},

	infoBody: {
		marginTop: 8,
		color: 'var(--muted)',
		lineHeight: 1.65,
	},

	stepsGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: 12,
	},

	stepCard: {
		border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
		borderRadius: 18,
		padding: 14,
		background: 'var(--surface-2)',
		boxShadow: 'var(--shadow-soft)',
	},

	stepTop: {
		display: 'flex',
		alignItems: 'center',
		gap: 10,
	},

	stepNum: {
		width: 28,
		height: 28,
		borderRadius: 10,
		display: 'grid',
		placeItems: 'center',
		fontWeight: 1100,
		border: '1px solid rgba(31,122,79,0.18)',
		background: 'rgba(31,122,79,0.06)',
		color: 'var(--primary)',
	},

	stepTitle: {
		fontWeight: 1100,
		letterSpacing: '-0.2px',
	},

	stepBody: {
		marginTop: 10,
		color: 'var(--muted)',
		lineHeight: 1.65,
	},

	cardsGrid4: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		gap: 12,
	},

	cardLink: {
		textDecoration: 'none',
		color: 'inherit',
	},

	peakCard: {
		border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
		borderRadius: 18,
		padding: 14,
		background: 'var(--surface-2)',
		boxShadow: 'var(--shadow-soft)',
	},

	peakTop: {
		display: 'flex',
		justifyContent: 'space-between',
		gap: 12,
		alignItems: 'flex-start',
	},

	peakTitle: {
		fontWeight: 1100,
		letterSpacing: '-0.2px',
		fontSize: 16,
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},

	peakSub: {
		marginTop: 6,
		opacity: 0.75,
		fontSize: 13,
	},

	elevBadge: {
		border: '1px solid rgba(31,122,79,0.22)',
		borderRadius: 999,
		padding: '7px 10px',
		fontWeight: 1000,
		fontSize: 13,
		whiteSpace: 'nowrap',
		color: 'var(--primary)',
		background: 'rgba(31,122,79,0.08)',
		flexShrink: 0,
	},

	peakBottom: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginTop: 12,
	},

	micro: {
		opacity: 0.7,
		fontSize: 12,
		fontWeight: 900,
	},

	arrow: {
		fontWeight: 1100,
		opacity: 0.85,
	},

	smallLink: {
		textDecoration: 'none',
		fontWeight: 1000,
		color: 'var(--primary)',
		borderBottom: '1px dashed rgba(31,122,79,0.55)',
	},

	cardSkeleton: {
		height: 110,
		background:
			'linear-gradient(90deg, rgba(15,23,42,0.06) 0%, rgba(15,23,42,0.10) 50%, rgba(15,23,42,0.06) 100%)',
		backgroundSize: '200% 100%',
		animation: 'shimmer 1.2s infinite',
	},

	notice: {
		border: '1px solid var(--border)',
		borderRadius: 18,
		padding: 14,
		background: 'rgba(15,23,42,0.03)',
		opacity: 0.85,
		fontWeight: 900,
	},

	noticeWarn: {
		border: '1px solid rgba(185,28,28,0.25)',
		borderRadius: 18,
		padding: 14,
		background: 'rgba(185,28,28,0.06)',
	},

	countryGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
		gap: 12,
	},

	countryCard: {
		display: 'flex',
		flexDirection: 'column',
		gap: 6,
		padding: 16,
		border: '1px solid var(--border)',
		borderRadius: 14,
		background: 'var(--surface-2)',
		color: 'var(--text)',
		textDecoration: 'none',
	},

	faqGrid: {
		display: 'grid',
		gap: 12,
	},

	faqItem: {
		border: '1px solid color-mix(in srgb, var(--primary) 14%, var(--border))',
		borderRadius: 18,
		padding: 14,
		background: 'var(--surface-2)',
		boxShadow: 'var(--shadow-soft)',
	},

	faqQ: {
		fontWeight: 1100,
		letterSpacing: '-0.2px',
	},

	faqA: {
		marginTop: 8,
		color: 'var(--muted)',
		lineHeight: 1.65,
	},
};
