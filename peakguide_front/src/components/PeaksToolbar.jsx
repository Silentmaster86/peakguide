import { useEffect, useState } from "react";

export default function PeaksToolbar({
	q,
	setQ,
	country,
	setCountry,
	region,
	setRegion,
	range,
	setRange,
	sort,
	setSort,
	ranges,
	countries,
	lang,
}) {
	const [localQ, setLocalQ] = useState(q || "");
	const t = getLabels(lang);
	const selectedCountry = (countries || []).find((item) => item.code === country);
	const regions = selectedCountry?.regions || [];
	const visibleRanges = (ranges || []).filter((item) => {
		if (country !== "all" && item.country_code !== country) return false;
		if (region !== "all" && item.region_slug !== region) return false;
		return true;
	});

	// Keep local input in sync when URL changes (e.g. back/forward)
	useEffect(() => {
		// This state mirrors an external URL value after browser navigation.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setLocalQ(q || "");
	}, [q]);

	// Debounce: push to URL after 300ms
	useEffect(() => {
		const t = setTimeout(() => {
			if ((q || "") !== (localQ || "")) setQ(localQ);
		}, 300);
		return () => clearTimeout(t);
	}, [localQ, q, setQ]);

	function clearSearch() {
		setLocalQ("");
		setQ(""); // immediately clears URL param
	}

	return (
		<div style={wrap}>
			{/* Search */}
			<label style={field}>
				<span style={label}>{t.search}</span>

				<div style={inputWrap}>
					<input
						value={localQ}
						onChange={(e) => setLocalQ(e.target.value)}
						placeholder={
							t.placeholder
						}
						style={input}
					/>

					{localQ?.trim() ? (
						<button
							type='button'
							onClick={clearSearch}
							style={clearX}
							aria-label={
								lang === "pl" ? "Wyczyść wyszukiwanie" : "Clear search"
							}
							title={lang === "pl" ? "Wyczyść" : "Clear"}
						>
							✕
						</button>
					) : null}
				</div>
			</label>

			{/* Country */}
			<label style={fieldSmall}>
				<span style={label}>{t.country}</span>
				<select
					value={country}
					onChange={(e) => setCountry(e.target.value)}
					style={select}
				>
					<option value='all'>{t.allCountries}</option>
					{(countries || []).map((item) => (
						<option key={item.code} value={item.code}>
							{item.flag_emoji} {item.name}
						</option>
					))}
				</select>
			</label>

			{/* Region */}
			{regions.length > 0 ? (
				<label style={fieldSmall}>
					<span style={label}>{t.region}</span>
					<select
						value={region}
						onChange={(e) => setRegion(e.target.value)}
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

			{/* Range */}
			<label style={field}>
				<span style={label}>{t.ranges}</span>
				<select
					value={range}
					onChange={(e) => setRange(e.target.value)}
					style={select}
				>
					<option value='all'>
						{t.allRanges}
					</option>
					{visibleRanges.map((r) => (
						<option key={r.slug} value={r.slug}>
							{r.name}
						</option>
					))}
				</select>
			</label>

			{/* Sort */}
			<label style={fieldSmall}>
				<span style={label}>{t.sort}</span>
				<select
					value={sort}
					onChange={(e) => setSort(e.target.value)}
					style={select}
				>
					<option value='elev_desc'>
						{lang === "pl" ? "Wysokość: ↓" : "Elevation: ↓"}
					</option>
					<option value='elev_asc'>
						{lang === "pl" ? "Wysokość: ↑" : "Elevation: ↑"}
					</option>
					<option value='name_asc'>
						{lang === "pl" ? "Nazwa: A→Z" : "Name: A→Z"}
					</option>
					<option value='name_desc'>
						{lang === "pl" ? "Nazwa: Z→A" : "Name: Z→A"}
					</option>
				</select>
			</label>
		</div>
	);
}

function getLabels(lang) {
	const labels = {
		pl: {
			search: "Szukaj",
			placeholder: "np. Rysy, Ben Nevis...",
			country: "Kraj",
			allCountries: "Wszystkie kraje",
			region: "Region",
			allRegions: "Wszystkie regiony",
			ranges: "Pasma",
			allRanges: "Wszystkie pasma",
			sort: "Sortuj",
		},
		en: {
			search: "Search",
			placeholder: "e.g. Rysy, Ben Nevis...",
			country: "Country",
			allCountries: "All countries",
			region: "Region",
			allRegions: "All regions",
			ranges: "Ranges",
			allRanges: "All ranges",
			sort: "Sort",
		},
		ua: {
			search: "Пошук",
			placeholder: "напр. Риси, Бен-Невіс...",
			country: "Країна",
			allCountries: "Усі країни",
			region: "Регіон",
			allRegions: "Усі регіони",
			ranges: "Хребти",
			allRanges: "Усі хребти",
			sort: "Сортувати",
		},
		zh: {
			search: "搜索",
			placeholder: "例如：里西山、本尼维斯山...",
			country: "国家",
			allCountries: "所有国家",
			region: "地区",
			allRegions: "所有地区",
			ranges: "山脉",
			allRanges: "所有山脉",
			sort: "排序",
		},
	};

	return labels[lang] || labels.pl;
}

/* ----------------------------- styles ------------------------------ */

const wrap = {
	display: "flex",
	gap: 12,
	flexWrap: "wrap",
	alignItems: "end",
	justifyContent: "flex-start",
	flex: "1 1 520px",
	minWidth: 200,
};

const field = {
	display: "grid",
	gap: 6,
	minWidth: 200,
	flex: "1 1 200px",
};

const fieldSmall = {
	display: "grid",
	gap: 6,
	minWidth: 200,
	flex: "0 1 260px",
};

const label = {
	fontSize: 12,
	color: "var(--text)",
	fontWeight: 800,
	letterSpacing: "0.8px",
};

const inputWrap = {
	position: "relative",
};

const input = {
	height: 42,
	width: "100%",
	padding: "0 38px 0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
	fontWeight: 900,
	boxShadow: "var(--shadow-soft)",
	outline: "none",
};

const clearX = {
	position: "absolute",
	right: 8,
	top: "50%",
	transform: "translateY(-50%)",
	height: 28,
	width: 28,
	borderRadius: 10,
	border: "1px solid var(--border)",
	background: "var(--btn-bg)",
	color: "var(--muted)",
	cursor: "pointer",
	fontWeight: 1000,
	lineHeight: 1,
};

const select = {
	height: 42,
	padding: "0 12px",
	borderRadius: 14,
	border: "1px solid var(--border)",
	background: "var(--surface)",
	color: "var(--toolbar-text)",
	boxShadow: "var(--shadow-soft)",
	outline: "none",
};
