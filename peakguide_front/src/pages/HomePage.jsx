import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { fetchPeaks, fetchTrails } from '../api/peakguide';
import { useAsync } from '../hooks/useAsync';

export default function HomePage({ lang = 'pl' }) {
	const t = useMemo(() => getLabels(lang), [lang]);
	const { hash } = useLocation();

	useEffect(() => {
		scrollToHash(hash);
	}, [hash]);

	const peaksState = useAsync(() => fetchPeaks({ lang }), [lang]);
	const trailsState = useAsync(() => fetchTrails({ lang }), [lang]);

	const peaks = useMemo(
		() => (Array.isArray(peaksState?.data) ? peaksState.data : []),
		[peaksState],
	);

	const trails = useMemo(
		() => (Array.isArray(trailsState?.data) ? trailsState.data : []),
		[trailsState],
	);

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

	const featuredPeaks = useMemo(() => getFeaturedPeaks(peaks, 8), [peaks]);

	return (
		<main className='home-page'>
			<Hero
				t={t}
				peaksCount={peaks.length}
				trailsCount={trails.length}
				countriesCount={countries.length}
			/>

			<QuickExplore t={t} />

			<ExploreCountries countries={countries} t={t} />

			<FeaturedPeaks t={t} peaksState={peaksState} peaks={featuredPeaks} />

			<Collections t={t} />

			<FeaturedTrails t={t} trails={trails} />

			<MapTeaser t={t} />

			<WhyPeakGuide t={t} />

			<HowItWorks t={t} />

			<Faq t={t} />
		</main>
	);
}

/* =========================================================
   HELPERS
   ========================================================= */

function getNavOffset() {
	const nav = document.getElementById('main-nav');
	return nav ? nav.getBoundingClientRect().height + 12 : 140;
}

function scrollToHash(hash) {
	if (!hash) return;

	requestAnimationFrame(() => {
		const element = document.querySelector(hash);

		if (!element) return;

		const y =
			element.getBoundingClientRect().top + window.scrollY - getNavOffset();

		window.scrollTo({
			top: y,
			behavior: 'smooth',
		});
	});
}

function getFeaturedPeaks(peaks, count = 8) {
	const byCountry = new Map();

	peaks.forEach((peak) => {
		if (!peak.country_slug) return;

		if (!byCountry.has(peak.country_slug)) {
			byCountry.set(peak.country_slug, []);
		}

		byCountry.get(peak.country_slug).push(peak);
	});

	const groups = Array.from(byCountry.values()).map((group) =>
		[...group].sort((a, b) => (b.elevation_m || 0) - (a.elevation_m || 0)),
	);

	const featured = [];
	let index = 0;

	while (featured.length < count) {
		let added = false;

		for (const group of groups) {
			if (!group[index]) continue;

			featured.push(group[index]);
			added = true;

			if (featured.length === count) break;
		}

		if (!added) break;

		index += 1;
	}

	return featured;
}

function getTrailName(trail) {
	return (
		trail.trail_name ||
		trail.name ||
		trail.slug
			?.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ') ||
		'Trail'
	);
}

function formatTrailTime(minutes) {
	if (!minutes) return '—';

	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;

	if (!mins) return `${hours}h`;

	return `${hours}h ${mins}m`;
}

/* =========================================================
   SHARED SECTION HEADING
   ========================================================= */

function SectionHeading({ eyebrow, title, subtitle, action }) {
	return (
		<header className='home-section-heading'>
			<div>
				{eyebrow ? <div className='home-section-eyebrow'>{eyebrow}</div> : null}

				<h2>{title}</h2>

				{subtitle ? <p>{subtitle}</p> : null}
			</div>

			{action ? <div className='home-section-action'>{action}</div> : null}
		</header>
	);
}

/* =========================================================
   HERO
   ========================================================= */

function Hero({ t, peaksCount, trailsCount, countriesCount }) {
	return (
		<section className='home-hero' style={styles.hero} aria-label='Welcome'>
			<div style={styles.heroOverlay} />

			<div className='home-hero-content' style={styles.heroContent}>
				<div style={styles.kicker}>{t.kicker}</div>

				<h1 className='home-hero-title' style={styles.h1}>
					{t.title}
				</h1>

				<p style={styles.lead}>{t.subtitle}</p>

				<div className='home-hero-actions' style={styles.heroActions}>
					<Link to='/peaks' style={styles.primaryCta}>
						{t.explorePeaks}
						<span aria-hidden='true'>→</span>
					</Link>

					<Link to='/trails' style={styles.secondaryCta}>
						{t.exploreTrails}
						<span aria-hidden='true'>→</span>
					</Link>
				</div>

				<div className='home-hero-stats' style={styles.heroStats}>
					<HeroStat value={peaksCount} label={t.peaksLabel} />

					<HeroStat value={trailsCount} label={t.trailsLabel} />

					<HeroStat value={countriesCount} label={t.countriesLabel} />
				</div>
			</div>
		</section>
	);
}

function HeroStat({ value, label }) {
	return (
		<div style={styles.heroStat}>
			<strong style={styles.heroStatValue}>{value}</strong>

			<span style={styles.heroStatLabel}>{label}</span>
		</div>
	);
}

/* =========================================================
   QUICK EXPLORE
   ========================================================= */

function QuickExplore({ t }) {
	const items = [
		{
			icon: '△',
			title: t.quickPeaks,
			body: t.quickPeaksBody,
			to: '/peaks',
		},
		{
			icon: '↗',
			title: t.quickTrails,
			body: t.quickTrailsBody,
			to: '/trails',
		},
		{
			icon: '◎',
			title: t.quickRanges,
			body: t.quickRangesBody,
			to: '/ranges',
		},
		{
			icon: '⌖',
			title: t.quickMap,
			body: t.quickMapBody,
			to: '#map',
		},
	];

	return (
		<section className='home-quick-explore'>
			{items.map((item) =>
				item.to.startsWith('#') ? (
					<a key={item.title} href={item.to} className='home-quick-card'>
						<QuickExploreContent item={item} />
					</a>
				) : (
					<Link key={item.title} to={item.to} className='home-quick-card'>
						<QuickExploreContent item={item} />
					</Link>
				),
			)}
		</section>
	);
}

function QuickExploreContent({ item }) {
	return (
		<>
			<span className='home-quick-icon'>{item.icon}</span>

			<div>
				<strong>{item.title}</strong>
				<span>{item.body}</span>
			</div>

			<span className='home-quick-arrow'>→</span>
		</>
	);
}

/* =========================================================
   COUNTRIES
   ========================================================= */

const futureCountries = [
	{
		slug: 'ukraine',
		name: 'Ukraine',
	},
	{
		slug: 'china',
		name: 'China',
	},
];

function ExploreCountries({ countries, t }) {
	const availableCountries = countries.map((country) => ({
		...country,
		available: true,
	}));

	const existingSlugs = new Set(
		availableCountries.map((country) => country.slug),
	);

	const future = futureCountries
		.filter((country) => !existingSlugs.has(country.slug))
		.map((country) => ({
			...country,
			available: false,
		}));

	const allCountries = [...availableCountries, ...future];

	return (
		<section className='home-section'>
			<SectionHeading
				eyebrow={t.discoverEyebrow}
				title={t.countriesTitle}
				subtitle={t.countriesSubtitle}
			/>

			<div className='country-showcase'>
				{allCountries.map((country, index) => (
					<CountryCard
						key={country.slug}
						country={country}
						index={index}
						t={t}
					/>
				))}
			</div>
		</section>
	);
}

function CountryCard({ country, index, t }) {
	const content = (
		<>
			<div className='country-card-overlay' />

			{!country.available ? (
				<span className='home-glass-badge'>{t.comingSoon}</span>
			) : null}

			<div className='country-card-content'>
				<span className='country-card-kicker'>
					{country.available
						? `${country.peaksCount} ${t.countryPeaks}`
						: t.futureDestination}
				</span>

				<h3>{country.name}</h3>

				{country.available ? (
					<span className='country-card-meta'>
						{country.rangesCount} {t.countryRanges}
					</span>
				) : null}

				<strong>
					{country.available ? `${t.exploreCountry} →` : t.comingSoon}
				</strong>
			</div>
		</>
	);

	const className = [
		'country-showcase-card',
		`country-card-${index + 1}`,
		!country.available ? 'is-disabled' : '',
	]
		.filter(Boolean)
		.join(' ');

	if (!country.available) {
		return <article className={className}>{content}</article>;
	}

	return (
		<Link to={`/peaks?country=${country.slug}`} className={className}>
			{content}
		</Link>
	);
}

/* =========================================================
   FEATURED PEAKS
   ========================================================= */

function FeaturedPeaks({ t, peaksState, peaks }) {
	const isLoading = peaksState?.status === 'loading';

	const isError = peaksState?.status === 'error';

	return (
		<section id='featured' className='home-section'>
			<SectionHeading
				eyebrow={t.featuredEyebrow}
				title={t.featuredTitle}
				subtitle={t.featuredSubtitle}
				action={
					<Link to='/peaks' className='home-section-link'>
						{t.seeAll} →
					</Link>
				}
			/>

			{isLoading ? (
				<FeaturedSkeleton />
			) : isError ? (
				<HomeNotice>
					<strong>{t.featuredErrorTitle}</strong>

					<span>{String(peaksState?.error || t.featuredErrorBody)}</span>
				</HomeNotice>
			) : peaks.length ? (
				<div className='featured-carousel'>
					{peaks.map((peak, index) => (
						<Link
							key={peak.slug}
							to={`/peaks/${peak.slug}`}
							className='featured-peak-card'
						>
							<div className='featured-peak-image' />

							<div className='featured-peak-overlay' />

							<span className='featured-peak-number'>
								{String(index + 1).padStart(2, '0')}
							</span>

							<div className='featured-peak-content'>
								<span className='featured-peak-location'>
									{peak.country_name || '—'}
									{peak.range_name ? ` · ${peak.range_name}` : ''}
								</span>

								<h3>{peak.peak_name || peak.name}</h3>

								<div className='featured-peak-footer'>
									<strong>
										{peak.elevation_m ? `${peak.elevation_m} m` : '—'}
									</strong>

									<span>{t.openDetails} →</span>
								</div>
							</div>
						</Link>
					))}
				</div>
			) : (
				<HomeNotice>{t.featuredEmpty}</HomeNotice>
			)}
		</section>
	);
}

function FeaturedSkeleton() {
	return (
		<div className='featured-carousel'>
			{Array.from({ length: 4 }).map((_, index) => (
				<div
					key={index}
					className='featured-peak-card featured-peak-skeleton'
				/>
			))}
		</div>
	);
}

/* =========================================================
   COLLECTIONS
   ========================================================= */

function Collections({ t }) {
	const collections = [
		{
			id: 'kgp',
			title: t.collectionKgp,
			subtitle: t.collectionKgpSubtitle,
			soon: false,
		},
		{
			id: 'three-peaks',
			title: t.collectionThreePeaks,
			subtitle: t.collectionThreePeaksSubtitle,
			soon: false,
		},
		{
			id: 'carpathians',
			title: t.collectionCarpathians,
			subtitle: t.comingSoon,
			soon: true,
		},
		{
			id: 'china',
			title: t.collectionChina,
			subtitle: t.comingSoon,
			soon: true,
		},
	];

	return (
		<section className='home-section'>
			<SectionHeading
				eyebrow={t.collectionsEyebrow}
				title={t.collectionsTitle}
				subtitle={t.collectionsSubtitle}
			/>

			<div className='collections-grid'>
				{collections.map((collection, index) => (
					<article
						key={collection.id}
						className={[
							'collection-card',
							`collection-card-${index + 1}`,
							collection.soon ? 'is-disabled' : '',
						]
							.filter(Boolean)
							.join(' ')}
					>
						<div className='collection-card-overlay' />

						{collection.soon ? (
							<span className='home-glass-badge'>{t.comingSoon}</span>
						) : null}

						<div className='collection-card-content'>
							<h3>{collection.title}</h3>

							<p>{collection.subtitle}</p>

							{!collection.soon ? (
								<strong>{t.exploreCollection} →</strong>
							) : null}
						</div>
					</article>
				))}
			</div>
		</section>
	);
}

/* =========================================================
   TRAILS
   ========================================================= */

function FeaturedTrails({ t, trails }) {
	const featuredTrails = trails.slice(0, 3);

	if (!featuredTrails.length) return null;

	return (
		<section className='home-section'>
			<SectionHeading
				eyebrow={t.trailsEyebrow}
				title={t.trailsTitle}
				subtitle={t.trailsSubtitle}
				action={
					<Link to='/trails' className='home-section-link'>
						{t.seeAllTrails} →
					</Link>
				}
			/>

			<div className='home-trails-grid'>
				{featuredTrails.map((trail) => (
					<Link
						key={trail.id}
						to={`/peaks/${trail.peak_slug}`}
						className='home-trail-card'
					>
						<div className='home-trail-top'>
							<div>
								<span className='home-trail-location'>
									{trail.country_name || t.trailFallbackCountry}
									{trail.range_name ? ` · ${trail.range_name}` : ''}
								</span>

								<h3>{getTrailName(trail)}</h3>

								{trail.peak_name ? <p>{trail.peak_name}</p> : null}
							</div>

							{trail.difficulty ? (
								<strong className='home-trail-difficulty'>
									{trail.difficulty}
								</strong>
							) : null}
						</div>

						<div className='home-trail-stats'>
							<span>
								<b>{trail.distance_km || '—'}</b> km
							</span>

							<span>
								<b>{trail.elevation_gain_m || '—'}</b> m ↑
							</span>

							<span>
								<b>{formatTrailTime(trail.time_min)}</b>
							</span>
						</div>

						<div className='home-trail-link'>{t.viewTrail} →</div>
					</Link>
				))}
			</div>
		</section>
	);
}

/* =========================================================
   MAP
   ========================================================= */

function MapTeaser({ t }) {
	return (
		<section id='map' className='map-teaser'>
			<div className='map-teaser-overlay' />

			<div className='map-teaser-content'>
				<span>{t.mapEyebrow}</span>

				<h2>{t.mapTitle}</h2>

				<p>{t.mapSubtitle}</p>

				<div className='map-teaser-button'>{t.mapComingSoon}</div>
			</div>
		</section>
	);
}

/* =========================================================
   WHY
   ========================================================= */

function WhyPeakGuide({ t }) {
	return (
		<section id='why' className='home-section home-why'>
			<SectionHeading
				eyebrow={t.whyEyebrow}
				title={t.whyTitle}
				subtitle={t.whySubtitle}
			/>

			<div className='home-why-grid'>
				{t.whyCards.map((card, index) => (
					<article key={card.title} className='home-why-card'>
						<span className='home-why-number'>0{index + 1}</span>

						<h3>{card.title}</h3>

						<p>{card.body}</p>
					</article>
				))}
			</div>
		</section>
	);
}

/* =========================================================
   HOW
   ========================================================= */

function HowItWorks({ t }) {
	return (
		<section id='how' className='home-section home-how'>
			<SectionHeading
				eyebrow={t.howEyebrow}
				title={t.howTitle}
				subtitle={t.howSubtitle}
			/>

			<div className='home-how-grid'>
				{t.steps.map((step) => (
					<article key={step.n} className='home-how-step'>
						<span>{step.n}</span>

						<div>
							<h3>{step.title}</h3>
							<p>{step.body}</p>
						</div>
					</article>
				))}
			</div>
		</section>
	);
}

/* =========================================================
   FAQ
   ========================================================= */

function Faq({ t }) {
	return (
		<section id='faq' className='home-section home-faq'>
			<SectionHeading
				eyebrow={t.faqEyebrow}
				title={t.faqTitle}
				subtitle={t.faqSubtitle}
			/>

			<div className='home-faq-list'>
				{t.faq.map((item) => (
					<details key={item.q} className='home-faq-item'>
						<summary>
							<span>{item.q}</span>
							<span aria-hidden='true'>+</span>
						</summary>

						<p>{item.a}</p>
					</details>
				))}
			</div>
		</section>
	);
}

function HomeNotice({ children }) {
	return <div className='home-notice'>{children}</div>;
}

/* =========================================================
   TRANSLATIONS
   ========================================================= */

function getLabels(lang) {
	const dict = {
		pl: {
			kicker: 'Eksploruj • Zdobywaj • Odkrywaj',
			title: 'Znajdź swoją następną górską przygodę',
			subtitle:
				'Odkrywaj szczyty, szlaki i praktyczne informacje górskie w całej Europie i nie tylko.',

			explorePeaks: 'Odkrywaj szczyty',
			exploreTrails: 'Odkrywaj trasy',

			peaksLabel: 'Szczyty',
			trailsLabel: 'Trasy',
			countriesLabel: 'Kraje',

			quickPeaks: 'Szczyty',
			quickPeaksBody: 'Odkrywaj góry',
			quickTrails: 'Trasy',
			quickTrailsBody: 'Znajdź szlak',
			quickRanges: 'Pasma',
			quickRangesBody: 'Przeglądaj regiony',
			quickMap: 'Mapa',
			quickMapBody: 'Odkrywaj wizualnie',

			discoverEyebrow: 'Kierunki',
			countriesTitle: 'Odkrywaj według kraju',
			countriesSubtitle:
				'Poznawaj góry, szczyty i trasy w różnych częściach świata.',
			countryPeaks: 'szczytów',
			countryRanges: 'pasm',
			exploreCountry: 'Odkrywaj',
			futureDestination: 'Przyszły kierunek',
			comingSoon: 'Wkrótce',

			featuredEyebrow: 'Wybrane miejsca',
			featuredTitle: 'Polecane szczyty',
			featuredSubtitle: 'Wybrane szczyty z różnych krajów i pasm górskich.',
			seeAll: 'Wszystkie szczyty',
			openDetails: 'Szczegóły',
			featuredEmpty: 'Brak dostępnych szczytów.',
			featuredErrorTitle: 'Nie udało się pobrać szczytów',
			featuredErrorBody: 'Spróbuj ponownie później.',

			collectionsEyebrow: 'Kolekcje',
			collectionsTitle: 'Popularne wyzwania i kolekcje',
			collectionsSubtitle:
				'Odkrywaj góry poprzez wybrane listy, regiony i górskie wyzwania.',
			collectionKgp: 'Korona Gór Polski',
			collectionKgpSubtitle: '28 szczytów · Polska',
			collectionThreePeaks: 'UK Three Peaks',
			collectionThreePeaksSubtitle: '3 kultowe szczyty · Wielka Brytania',
			collectionCarpathians: 'Karpaty Ukraińskie',
			collectionChina: 'Góry Chin',
			exploreCollection: 'Odkrywaj kolekcję',

			trailsEyebrow: 'Na szlaku',
			trailsTitle: 'Polecane trasy',
			trailsSubtitle:
				'Praktyczne informacje pomagające zaplanować kolejną górską trasę.',
			seeAllTrails: 'Wszystkie trasy',
			viewTrail: 'Zobacz trasę',
			trailFallbackCountry: 'Góry',

			mapEyebrow: 'Odkrywaj wizualnie',
			mapTitle: 'Góry na jednej mapie',
			mapSubtitle:
				'Odkrywaj szczyty, trasy, punkty startowe i miejsca warte zobaczenia bezpośrednio na mapie.',
			mapComingSoon: 'Interaktywna mapa — wkrótce',

			whyEyebrow: 'PeakGuide',
			whyTitle: 'Wszystko, czego potrzebujesz przed wyjściem',
			whySubtitle:
				'Jedno miejsce do odkrywania gór i planowania kolejnych wypraw.',
			whyCards: [
				{
					title: 'Szybko i czytelnie',
					body: 'Najważniejsze informacje o szczytach i trasach bez niepotrzebnego szukania.',
				},
				{
					title: 'Praktyczne planowanie',
					body: 'Trasy, punkty startowe, parking, dostęp i informacje przydatne przed wyjściem.',
				},
				{
					title: 'Rosnąca baza',
					body: 'Kolejne kraje, regiony, szczyty i trasy są stopniowo dodawane do PeakGuide.',
				},
			],

			howEyebrow: 'Prosty proces',
			howTitle: 'Jak działa PeakGuide',
			howSubtitle:
				'Od pomysłu na wycieczkę do gotowego planu w trzech krokach.',
			steps: [
				{
					n: '01',
					title: 'Odkrywaj',
					body: 'Przeglądaj kraje, pasma, szczyty i dostępne trasy.',
				},
				{
					n: '02',
					title: 'Sprawdź szczegóły',
					body: 'Poznaj wysokość, położenie, trasę i dostępne informacje praktyczne.',
				},
				{
					n: '03',
					title: 'Zaplanuj wyjście',
					body: 'Wykorzystaj informacje o trasie, starcie, dostępie i parkingu.',
				},
			],

			faqEyebrow: 'Pomoc',
			faqTitle: 'Najczęstsze pytania',
			faqSubtitle: 'Kilka szybkich odpowiedzi o PeakGuide.',
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
					a: 'Dane są rozwijane na podstawie sprawdzanych źródeł. Projekt będzie również rozwijany o dokładniejsze informacje o źródłach i aktualności danych.',
				},
				{
					q: 'Czy będą dodawane nowe funkcje?',
					a: 'Tak. Planowany jest dalszy rozwój map, pogody, danych terenowych, punktów POI, kolekcji i funkcji użytkownika.',
				},
			],
		},

		en: {
			kicker: 'EXPLORE • CLIMB • DISCOVER',
			title: 'Find your next mountain adventure',
			subtitle:
				'Discover peaks, hiking trails and practical mountain information across Europe and beyond.',

			explorePeaks: 'Explore Peaks',
			exploreTrails: 'Explore Trails',

			peaksLabel: 'Peaks',
			trailsLabel: 'Trails',
			countriesLabel: 'Countries',

			quickPeaks: 'Peaks',
			quickPeaksBody: 'Discover mountains',
			quickTrails: 'Trails',
			quickTrailsBody: 'Find a route',
			quickRanges: 'Ranges',
			quickRangesBody: 'Browse regions',
			quickMap: 'Map',
			quickMapBody: 'Explore visually',

			discoverEyebrow: 'Destinations',
			countriesTitle: 'Explore by country',
			countriesSubtitle:
				'Discover mountains, peaks and trails across different parts of the world.',
			countryPeaks: 'peaks',
			countryRanges: 'ranges',
			exploreCountry: 'Explore',
			futureDestination: 'Future destination',
			comingSoon: 'Coming soon',

			featuredEyebrow: 'Selected places',
			featuredTitle: 'Featured peaks',
			featuredSubtitle:
				'Discover selected peaks from different countries and mountain ranges.',
			seeAll: 'All peaks',
			openDetails: 'Details',
			featuredEmpty: 'No peaks are currently available.',
			featuredErrorTitle: 'Failed to fetch peaks',
			featuredErrorBody: 'Please try again later.',

			collectionsEyebrow: 'Collections',
			collectionsTitle: 'Popular challenges and collections',
			collectionsSubtitle:
				'Explore mountains through selected lists, regions and mountain challenges.',
			collectionKgp: 'Crown of Polish Mountains',
			collectionKgpSubtitle: '28 peaks · Poland',
			collectionThreePeaks: 'UK Three Peaks',
			collectionThreePeaksSubtitle: '3 iconic peaks · United Kingdom',
			collectionCarpathians: 'Ukrainian Carpathians',
			collectionChina: 'Mountains of China',
			exploreCollection: 'Explore collection',

			trailsEyebrow: 'On the trail',
			trailsTitle: 'Featured trails',
			trailsSubtitle:
				'Practical route information for planning your next mountain adventure.',
			seeAllTrails: 'All trails',
			viewTrail: 'View trail',
			trailFallbackCountry: 'Mountains',

			mapEyebrow: 'Explore visually',
			mapTitle: 'Mountains on one map',
			mapSubtitle:
				'Discover peaks, trails, starting points and places worth visiting directly on the map.',
			mapComingSoon: 'Interactive map — coming soon',

			whyEyebrow: 'PeakGuide',
			whyTitle: 'Everything you need before heading out',
			whySubtitle:
				'One place for discovering mountains and planning your next adventure.',
			whyCards: [
				{
					title: 'Fast and clear',
					body: 'The most useful information about peaks and trails without unnecessary searching.',
				},
				{
					title: 'Practical planning',
					body: 'Trails, starting points, parking, access and useful information before your trip.',
				},
				{
					title: 'Growing database',
					body: 'More countries, regions, peaks and trails are gradually being added to PeakGuide.',
				},
			],

			howEyebrow: 'Simple process',
			howTitle: 'How PeakGuide works',
			howSubtitle: 'From an idea to a mountain plan in three simple steps.',
			steps: [
				{
					n: '01',
					title: 'Explore',
					body: 'Browse countries, ranges, peaks and available trails.',
				},
				{
					n: '02',
					title: 'Check the details',
					body: 'See elevation, location, trail information and practical details.',
				},
				{
					n: '03',
					title: 'Plan your outing',
					body: 'Use route, starting point, access and parking information.',
				},
			],

			faqEyebrow: 'Help',
			faqTitle: 'Frequently asked questions',
			faqSubtitle: 'A few quick answers about PeakGuide.',
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
					a: 'Data is developed using verified sources, with clearer source and freshness information planned.',
				},
				{
					q: 'Are more features planned?',
					a: 'Yes. Future development includes maps, weather, terrain data, POIs, collections and user features.',
				},
			],
		},

		ua: {
			kicker: 'ДОСЛІДЖУЙ • ПІДКОРЮЙ • ВІДКРИВАЙ',
			title: 'Знайди свою наступну гірську пригоду',
			subtitle:
				'Відкривай вершини, туристичні маршрути та практичну інформацію про гори в Європі та за її межами.',

			explorePeaks: 'Досліджувати вершини',
			exploreTrails: 'Досліджувати маршрути',

			peaksLabel: 'Вершини',
			trailsLabel: 'Маршрути',
			countriesLabel: 'Країни',

			quickPeaks: 'Вершини',
			quickPeaksBody: 'Відкривай гори',
			quickTrails: 'Маршрути',
			quickTrailsBody: 'Знайди маршрут',
			quickRanges: 'Хребти',
			quickRangesBody: 'Переглядай регіони',
			quickMap: 'Карта',
			quickMapBody: 'Досліджуй візуально',

			discoverEyebrow: 'Напрямки',
			countriesTitle: 'Досліджуйте за країною',
			countriesSubtitle:
				'Відкривайте гори, вершини та маршрути в різних куточках світу.',
			countryPeaks: 'вершин',
			countryRanges: 'гірських масивів',
			exploreCountry: 'Досліджувати',
			futureDestination: 'Майбутній напрямок',
			comingSoon: 'Незабаром',

			featuredEyebrow: 'Вибрані місця',
			featuredTitle: 'Рекомендовані вершини',
			featuredSubtitle: 'Вибрані вершини з різних країн і гірських регіонів.',
			seeAll: 'Усі вершини',
			openDetails: 'Деталі',
			featuredEmpty: 'Немає доступних вершин.',
			featuredErrorTitle: 'Не вдалося завантажити вершини',
			featuredErrorBody: 'Спробуйте ще раз пізніше.',

			collectionsEyebrow: 'Колекції',
			collectionsTitle: 'Популярні виклики та колекції',
			collectionsSubtitle:
				'Відкривайте гори через вибрані списки, регіони та гірські виклики.',
			collectionKgp: 'Корона польських гір',
			collectionKgpSubtitle: '28 вершин · Польща',
			collectionThreePeaks: 'UK Three Peaks',
			collectionThreePeaksSubtitle: '3 культові вершини · Велика Британія',
			collectionCarpathians: 'Українські Карпати',
			collectionChina: 'Гори Китаю',
			exploreCollection: 'Відкрити колекцію',

			trailsEyebrow: 'На маршруті',
			trailsTitle: 'Рекомендовані маршрути',
			trailsSubtitle:
				'Практична інформація для планування наступного гірського маршруту.',
			seeAllTrails: 'Усі маршрути',
			viewTrail: 'Переглянути маршрут',
			trailFallbackCountry: 'Гори',

			mapEyebrow: 'Досліджуйте візуально',
			mapTitle: 'Гори на одній карті',
			mapSubtitle:
				'Відкривайте вершини, маршрути, стартові точки та цікаві місця безпосередньо на карті.',
			mapComingSoon: 'Інтерактивна карта — незабаром',

			whyEyebrow: 'PeakGuide',
			whyTitle: 'Усе необхідне перед виходом у гори',
			whySubtitle:
				'Одне місце для відкриття гір і планування наступних пригод.',
			whyCards: [
				{
					title: 'Швидко і зрозуміло',
					body: 'Найважливіша інформація про вершини та маршрути в одному місці.',
				},
				{
					title: 'Практичне планування',
					body: 'Маршрути, стартові точки, паркування, доступ та корисна інформація.',
				},
				{
					title: 'База, що зростає',
					body: 'Нові країни, регіони, вершини та маршрути поступово додаються до PeakGuide.',
				},
			],

			howEyebrow: 'Простий процес',
			howTitle: 'Як працює PeakGuide',
			howSubtitle: 'Від ідеї до плану походу за три прості кроки.',
			steps: [
				{
					n: '01',
					title: 'Досліджуйте',
					body: 'Переглядайте країни, хребти, вершини та маршрути.',
				},
				{
					n: '02',
					title: 'Перевірте деталі',
					body: 'Переглядайте висоту, розташування, маршрут та практичну інформацію.',
				},
				{
					n: '03',
					title: 'Плануйте похід',
					body: 'Використовуйте інформацію про маршрут, старт, доступ і паркування.',
				},
			],

			faqEyebrow: 'Допомога',
			faqTitle: 'Поширені запитання',
			faqSubtitle: 'Короткі відповіді про PeakGuide.',
			faq: [
				{
					q: 'Які країни охоплює PeakGuide?',
					a: 'Наразі база охоплює Польщу та Велику Британію. Планується додавання нових країн і регіонів.',
				},
				{
					q: 'Чи містить PeakGuide туристичні маршрути?',
					a: 'Так. Маршрути можуть містити відстань, набір висоти, орієнтовний час, складність та практичну інформацію.',
				},
				{
					q: 'Звідки походять дані?',
					a: 'Дані розвиваються на основі перевірених джерел.',
				},
				{
					q: 'Чи будуть нові функції?',
					a: 'Так. Планується розвиток карт, погоди, даних про рельєф, POI, колекцій та функцій користувача.',
				},
			],
		},

		zh: {
			kicker: '探索 • 攀登 • 发现',
			title: '寻找你的下一次山地探险',
			subtitle: '探索欧洲及世界各地的山峰、徒步路线和实用山地信息。',

			explorePeaks: '探索山峰',
			exploreTrails: '探索路线',

			peaksLabel: '山峰',
			trailsLabel: '路线',
			countriesLabel: '国家',

			quickPeaks: '山峰',
			quickPeaksBody: '探索山地',
			quickTrails: '路线',
			quickTrailsBody: '寻找路线',
			quickRanges: '山脉',
			quickRangesBody: '浏览地区',
			quickMap: '地图',
			quickMapBody: '视觉探索',

			discoverEyebrow: '目的地',
			countriesTitle: '按国家探索',
			countriesSubtitle: '探索世界不同地区的山脉、山峰和徒步路线。',
			countryPeaks: '座山峰',
			countryRanges: '个山脉',
			exploreCountry: '探索',
			futureDestination: '未来目的地',
			comingSoon: '即将推出',

			featuredEyebrow: '精选地点',
			featuredTitle: '精选山峰',
			featuredSubtitle: '探索来自不同国家和山脉的精选山峰。',
			seeAll: '全部山峰',
			openDetails: '详情',
			featuredEmpty: '暂无山峰数据。',
			featuredErrorTitle: '获取山峰失败',
			featuredErrorBody: '请稍后重试。',

			collectionsEyebrow: '合集',
			collectionsTitle: '热门挑战与合集',
			collectionsSubtitle: '通过精选列表、地区和山地挑战探索更多山峰。',
			collectionKgp: '波兰山峰之冠',
			collectionKgpSubtitle: '28 座山峰 · 波兰',
			collectionThreePeaks: '英国三峰挑战',
			collectionThreePeaksSubtitle: '3 座经典山峰 · 英国',
			collectionCarpathians: '乌克兰喀尔巴阡山脉',
			collectionChina: '中国山岳',
			exploreCollection: '探索合集',

			trailsEyebrow: '徒步路线',
			trailsTitle: '精选路线',
			trailsSubtitle: '帮助你规划下一次山地徒步的实用路线信息。',
			seeAllTrails: '全部路线',
			viewTrail: '查看路线',
			trailFallbackCountry: '山地',

			mapEyebrow: '视觉探索',
			mapTitle: '一张地图探索群山',
			mapSubtitle: '直接在地图上探索山峰、路线、起点和值得游览的地点。',
			mapComingSoon: '互动地图 — 即将推出',

			whyEyebrow: 'PeakGuide',
			whyTitle: '出发前所需的一切',
			whySubtitle: '一个用于探索山地和规划下一次旅程的平台。',
			whyCards: [
				{
					title: '快速清晰',
					body: '在一个地方查看有关山峰和路线的重要信息。',
				},
				{
					title: '实用规划',
					body: '路线、起点、停车、通行方式以及出发前需要的信息。',
				},
				{
					title: '不断扩展',
					body: 'PeakGuide 将逐步加入更多国家、地区、山峰和路线。',
				},
			],

			howEyebrow: '简单流程',
			howTitle: 'PeakGuide 如何使用',
			howSubtitle: '通过三个简单步骤从想法到完成山地行程规划。',
			steps: [
				{
					n: '01',
					title: '探索',
					body: '浏览国家、山脉、山峰和可用路线。',
				},
				{
					n: '02',
					title: '查看详情',
					body: '查看海拔、位置、路线以及实用信息。',
				},
				{
					n: '03',
					title: '规划行程',
					body: '利用路线、起点、通行和停车信息规划行程。',
				},
			],

			faqEyebrow: '帮助',
			faqTitle: '常见问题',
			faqSubtitle: '关于 PeakGuide 的快速解答。',
			faq: [
				{
					q: 'PeakGuide 目前覆盖哪些国家？',
					a: '目前数据库包括波兰和英国，未来计划加入更多国家和地区。',
				},
				{
					q: 'PeakGuide 是否包含徒步路线？',
					a: '是的。路线可以包含距离、累计爬升、预计时间、难度和实用信息。',
				},
				{
					q: '数据来自哪里？',
					a: '数据基于经过核实的来源进行收集和完善。',
				},
				{
					q: '未来还会增加新功能吗？',
					a: '会。未来计划继续开发地图、天气、地形数据、POI、合集以及用户功能。',
				},
			],
		},
	};

	return dict[lang] || dict.pl;
}

/* =========================================================
   HERO INLINE STYLES

   Hero zostawiamy tutaj, ponieważ jest już sprawdzony.
   Reszta HomePage będzie stylowana w CSS.
   ========================================================= */

const styles = {
	hero: {
		position: 'relative',
		minHeight: 'clamp(520px, 72vh, 760px)',
		display: 'flex',
		alignItems: 'center',
		overflow: 'hidden',

		border: '1px solid color-mix(in srgb, var(--primary) 18%, transparent)',
		borderRadius: 28,

		backgroundImage: "url('/images/home/hero.png')",
		backgroundSize: 'cover',
		backgroundPosition: 'center',
		backgroundRepeat: 'no-repeat',

		boxShadow: 'var(--shadow-soft)',
		isolation: 'isolate',
	},

	heroOverlay: {
		position: 'absolute',
		inset: 0,
		zIndex: 0,

		background: `
      linear-gradient(
        90deg,
        rgba(5, 10, 8, 0.88) 0%,
        rgba(5, 10, 8, 0.72) 36%,
        rgba(5, 10, 8, 0.34) 68%,
        rgba(5, 10, 8, 0.12) 100%
      ),
      linear-gradient(
        0deg,
        rgba(5, 10, 8, 0.45) 0%,
        transparent 45%
      )
    `,
	},

	heroContent: {
		position: 'relative',
		zIndex: 1,
		width: 'min(820px, 100%)',
		padding: 'clamp(28px, 5vw, 72px)',
		color: '#fff',
	},

	kicker: {
		fontSize: 11,
		fontWeight: 900,
		opacity: 0.78,
		letterSpacing: '0.12em',
		textTransform: 'uppercase',
	},

	h1: {
		margin: '14px 0 0',
		fontSize: 'clamp(36px, 4.2vw, 60px)',
		lineHeight: 1.02,
		letterSpacing: '-0.035em',
		fontWeight: 900,
		maxWidth: 760,
		color: '#fff',
	},

	lead: {
		margin: '18px 0 0',
		maxWidth: 620,
		color: 'rgba(255,255,255,.78)',
		fontSize: 'clamp(14px, 1.2vw, 17px)',
		lineHeight: 1.65,
	},

	heroActions: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: 12,
		marginTop: 28,
	},

	primaryCta: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		padding: '12px 18px',
		borderRadius: 12,
		background: 'var(--primary)',
		color: '#06130d',
		fontWeight: 850,
		textDecoration: 'none',
		boxShadow: '0 10px 30px rgba(0,0,0,.2)',
	},

	secondaryCta: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 10,
		padding: '12px 18px',
		borderRadius: 12,
		border: '1px solid rgba(255,255,255,.28)',
		background: 'rgba(10,16,13,.28)',
		backdropFilter: 'blur(10px)',
		color: '#fff',
		fontWeight: 850,
		textDecoration: 'none',
	},

	heroStats: {
		display: 'flex',
		alignItems: 'stretch',
		flexWrap: 'wrap',
		gap: 1,
		marginTop: 38,
		width: 'fit-content',
		maxWidth: '100%',
		overflow: 'hidden',
		border: '1px solid rgba(255,255,255,.18)',
		borderRadius: 16,
		background: 'rgba(7,12,10,.34)',
		backdropFilter: 'blur(12px)',
	},

	heroStat: {
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		minWidth: 120,
		padding: '14px 20px',
		background: 'rgba(255,255,255,.035)',
	},

	heroStatValue: {
		fontSize: 24,
		lineHeight: 1,
		color: '#fff',
		fontWeight: 900,
	},

	heroStatLabel: {
		marginTop: 7,
		fontSize: 11,
		fontWeight: 800,
		letterSpacing: '0.08em',
		textTransform: 'uppercase',
		color: 'rgba(255,255,255,.62)',
	},
};
