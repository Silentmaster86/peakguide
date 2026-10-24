import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchTrails } from '../api/peakguide';

import TrailCard from '../components/TrailCard';

const translations = {
	pl: {
		title: 'Trasy',
		loading: 'Ładowanie tras...',
		error: 'Nie udało się załadować tras.',
		empty: 'Brak dostępnych tras.',
		searchPlaceholder: 'Szukaj trasy...',
		noResults: 'Nie znaleziono tras spełniających kryteria.',
		allCountries: 'Wszystkie kraje',
		allDifficulties: 'Wszystkie poziomy trudności',
		hard: 'Trudna',
		easy: 'Łatwa',
		moderate: 'Średnia',
		results: 'Liczba tras',
		clearFilters: 'Wyczyść filtry',
	},
	en: {
		title: 'Trails',
		loading: 'Loading trails...',
		error: 'Failed to load trails.',
		empty: 'No trails available.',
		searchPlaceholder: 'Search trails...',
		noResults: 'No trails found matching your criteria.',
		allCountries: 'All countries',
		allDifficulties: 'All difficulties',
		hard: 'Hard',
		easy: 'Easy',
		moderate: 'Moderate',
		results: 'Trails found',
		clearFilters: 'Clear filters',
	},
	ua: {
		title: 'Маршрути',
		loading: 'Завантаження маршрутів...',
		error: 'Не вдалося завантажити маршрути.',
		empty: 'Немає доступних маршрутів.',
		searchPlaceholder: 'Пошук маршрутів...',
		noResults: 'Не знайдено маршрутів, що відповідають вашим критеріям.',
		allCountries: 'Yсі краї',
		allDifficulties: 'Yсі рівні складності',
		hard: 'Складна',
		easy: 'Легка',
		moderate: 'Середня',
		results: 'Знайдено маршрутів',
		clearFilters: 'Очистити фільтри',
	},
	zh: {
		title: '路线',
		loading: '正在加载路线...',
		error: '无法加载路线。',
		empty: '暂无可用路线。',
		searchPlaceholder: '搜索路线...',
		noResults: '未找到符合您条件的路线。',
		allCountries: '所有国家',
		allDifficulties: '所有难度',
		hard: '困难',
		easy: '简单',
		moderate: '中等',
		results: '找到的路线',
		clearFilters: '清除筛选',
	},
};

export default function TrailsPage({ lang }) {
	const t = translations[lang] || translations.en;

	const [searchParams, setSearchParams] = useSearchParams();

	const query = searchParams.get('q') || '';
	const country = searchParams.get('country') || '';
	const difficulty = searchParams.get('difficulty') || '';

	const [trails, setTrails] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function loadTrails() {
			try {
				const data = await fetchTrails({ lang });

				if (!cancelled) {
					setTrails(data);
					setError(false);
					setLoading(false);
				}
			} catch (err) {
				if (!cancelled) {
					console.error('Failed to load trails:', err);
					setError(true);
					setLoading(false);
				}
			}
		}

		loadTrails();

		return () => {
			cancelled = true;
		};
	}, [lang]);

	if (loading) {
		return (
			<main className='page'>
				<p>{t.loading}</p>
			</main>
		);
	}

	if (error) {
		return (
			<main className='page'>
				<p>{t.error}</p>
			</main>
		);
	}

	if (trails.length === 0) {
		return (
			<main className='page'>
				<h1>{t.title}</h1>
				<p>{t.empty}</p>
			</main>
		);
	}

	const countries = Array.from(
		new Map(
			trails.map((trail) => [
				trail.country_slug,
				{
					slug: trail.country_slug,
					name: trail.country_name,
				},
			]),
		).values(),
	);

	const difficulties = [
		...new Set(trails.map((trail) => trail.difficulty).filter(Boolean)),
	];

	const filteredTrails = trails.filter((trail) => {
		const search = query.trim().toLowerCase();

		const matchesSearch =
			!search ||
			trail.name.toLowerCase().includes(search) ||
			trail.peak_name.toLowerCase().includes(search) ||
			trail.range_name.toLowerCase().includes(search) ||
			trail.region_name.toLowerCase().includes(search) ||
			trail.country_name.toLowerCase().includes(search);

		const matchesCountry = !country || trail.country_slug === country;
		const matchesDifficulty = !difficulty || trail.difficulty === difficulty;

		return matchesSearch && matchesCountry && matchesDifficulty;
	});

	return (
		<main className='page'>
			<h1>{t.title}</h1>

			<div className='trails-toolbar' style={toolbar}>
				<input
					style={control}
					type='search'
					value={query}
					placeholder={t.searchPlaceholder}
					onChange={(e) => {
						const value = e.target.value;

						setSearchParams((params) => {
							if (value) {
								params.set('q', value);
							} else {
								params.delete('q');
							}

							return params;
						});
					}}
				/>

				<select
					style={control}
					value={country}
					onChange={(e) => {
						const value = e.target.value;

						setSearchParams((params) => {
							if (value) {
								params.set('country', value);
							} else {
								params.delete('country');
							}

							return params;
						});
					}}
				>
					<option value=''>{t.allCountries}</option>

					{countries.map((item) => (
						<option key={item.slug} value={item.slug}>
							{item.name}
						</option>
					))}
				</select>

				<select
					style={control}
					value={difficulty}
					onChange={(e) => {
						const value = e.target.value;

						setSearchParams((params) => {
							if (value) {
								params.set('difficulty', value);
							} else {
								params.delete('difficulty');
							}

							return params;
						});
					}}
				>
					<option value=''>{t.allDifficulties}</option>

					{difficulties.map((item) => (
						<option key={item} value={item}>
							{t[item] || item}
						</option>
					))}
				</select>
			</div>

			<div className='trails-results-bar'>
				<span>
					{t.results}: <strong>{filteredTrails.length}</strong>
				</span>

				{(query || country || difficulty) && (
					<button
						type='button'
						className='trails-clear-btn'
						onClick={() => setSearchParams({})}
					>
						{t.clearFilters}
					</button>
				)}
			</div>

			{filteredTrails.length === 0 ? (
				<p>{t.noResults}</p>
			) : (
				filteredTrails.map((trail) => (
					<TrailCard key={trail.id} trail={trail} lang={lang} />
				))
			)}
		</main>
	);
}

const toolbar = {
	display: 'grid',
	gridTemplateColumns: 'minmax(200px, 1fr) auto auto',
	gap: 10,
	alignItems: 'center',
	marginBottom: 18,
};

const control = {
	width: '100%',
	minHeight: 42,
	padding: '9px 12px',
	border: '1px solid var(--border)',
	borderRadius: 12,
	background: 'var(--btn-bg)',
	color: 'var(--toolbar-text)',
	outline: 'none',
};
