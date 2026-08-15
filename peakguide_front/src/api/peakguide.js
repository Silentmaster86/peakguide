import { supabase } from '../lib/supabaseClient';

/**
 * PeakGuide Supabase API client
 * Public read-only data: peaks, ranges, trails, pois, nearby.
 */

const cache = {
	countries: new Map(),
	peaks: new Map(),
	ranges: new Map(),
	peakBySlug: new Map(),
	trailsBySlug: new Map(),
	poisBySlug: new Map(),
	rangeBySlug: new Map(),
	nearbyBySlug: new Map(),
};

function apiLang(lang) {
	const v = (lang || 'pl').toLowerCase();
	if (['pl', 'en', 'ua', 'zh'].includes(v)) return v;
	return 'pl';
}

function first(arr) {
	return Array.isArray(arr) ? arr[0] : arr;
}

function translation(rows, lang) {
	return (rows || []).find((row) => row.lang === lang);
}

/* ------------------------------------------------------------------ */
/* Countries and regions                                               */
/* ------------------------------------------------------------------ */

export async function fetchCountries({ lang = 'pl' } = {}) {
	const safeLang = apiLang(lang);

	if (cache.countries.has(safeLang)) return cache.countries.get(safeLang);

	const { data, error } = await supabase
		.from('countries')
		.select(
			`
      id,
      code,
      slug,
      flag_emoji,
      sort_order,
      countries_i18n (
        name,
        description,
        lang
      ),
      regions (
        id,
        slug,
        sort_order,
        active,
        regions_i18n (
          name,
          description,
          lang
        )
      )
    `,
		)
		.eq('active', true)
		.order('sort_order', { ascending: true });

	if (error) throw error;

	const mapped = (data || []).map((country) => {
		const i18n = translation(country.countries_i18n, safeLang);
		const regions = (country.regions || [])
			.filter((region) => region.active)
			.map((region) => {
				const regionI18n = translation(region.regions_i18n, safeLang);

				return {
					id: region.id,
					slug: region.slug,
					name: regionI18n?.name || region.slug,
					description: regionI18n?.description || '',
					sort_order: region.sort_order,
				};
			})
			.sort((a, b) => a.sort_order - b.sort_order);

		return {
			id: country.id,
			code: country.code,
			slug: country.slug,
			name: i18n?.name || country.slug,
			description: i18n?.description || '',
			flag_emoji: country.flag_emoji || '',
			sort_order: country.sort_order,
			regions,
		};
	});

	cache.countries.set(safeLang, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Peaks list                                                          */
/* ------------------------------------------------------------------ */

export async function fetchPeaks({ lang = 'pl', only = 'all' } = {}) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${only}`;

	if (cache.peaks.has(key)) return cache.peaks.get(key);

	let query = supabase
		.from('peaks')
		.select(
			`
      id,
      slug,
      elevation_m,
      latitude,
      longitude,
      difficulty,
      best_season,
      cover_image_url,
      is_korona,
      active,
      peaks_i18n!inner (
        name,
        short_description,
        description,
        lang
      ),
      mountain_ranges (
        slug,
        mountain_ranges_i18n (
          name,
          lang
        ),
        countries (
          code,
          slug,
          flag_emoji,
          countries_i18n (
            name,
            lang
          )
        ),
        regions (
          slug,
          regions_i18n (
            name,
            lang
          )
        )
      )
    `,
		)
		.eq('active', true)
		.eq('peaks_i18n.lang', safeLang);

	if (only === 'korona') query = query.eq('is_korona', true);
	if (only === 'nearby') query = query.eq('is_korona', false);

	const { data, error } = await query.order('elevation_m', {
		ascending: false,
	});

	if (error) throw error;

	const mapped = (data || []).map((p) => {
		const i18n = first(p.peaks_i18n);
		const rangeI18n = (p.mountain_ranges?.mountain_ranges_i18n || []).find(
			(r) => r.lang === safeLang,
		);
		const country = p.mountain_ranges?.countries;
		const region = p.mountain_ranges?.regions;
		const countryI18n = translation(country?.countries_i18n, safeLang);
		const regionI18n = translation(region?.regions_i18n, safeLang);

		return {
			...p,
			peak_name: i18n?.name || p.slug,
			name: i18n?.name || p.slug,
			short_description: i18n?.short_description || '',
			description: i18n?.description || '',
			range_slug: p.mountain_ranges?.slug || '',
			range_name: rangeI18n?.name || '',
			country_code: country?.code || '',
			country_slug: country?.slug || '',
			country_name: countryI18n?.name || country?.slug || '',
			country_flag: country?.flag_emoji || '',
			region_slug: region?.slug || '',
			region_name: regionI18n?.name || region?.slug || '',
		};
	});

	cache.peaks.set(key, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Ranges list                                                         */
/* ------------------------------------------------------------------ */

export async function fetchRanges({ lang = 'pl' } = {}) {
	const safeLang = apiLang(lang);

	if (cache.ranges.has(safeLang)) return cache.ranges.get(safeLang);

	const { data, error } = await supabase
		.from('mountain_ranges')
		.select(
			`
      id,
      slug,
      country_id,
      region_id,
      mountain_ranges_i18n!inner (
        name,
        description,
        lang
      ),
      countries (
        code,
        slug,
        flag_emoji,
        countries_i18n (
          name,
          lang
        )
      ),
      regions (
        slug,
        regions_i18n (
          name,
          lang
        )
      )
    `,
		)
		.eq('mountain_ranges_i18n.lang', safeLang)
		.order('slug', { ascending: true });

	if (error) throw error;

	const mapped = (data || []).map((r) => {
		const i18n = first(r.mountain_ranges_i18n);
		const countryI18n = translation(r.countries?.countries_i18n, safeLang);
		const regionI18n = translation(r.regions?.regions_i18n, safeLang);

		return {
			id: r.id,
			slug: r.slug,
			name: i18n?.name || r.slug,
			description: i18n?.description || '',
			country_code: r.countries?.code || '',
			country_slug: r.countries?.slug || '',
			country_name: countryI18n?.name || r.countries?.slug || '',
			country_flag: r.countries?.flag_emoji || '',
			region_slug: r.regions?.slug || '',
			region_name: regionI18n?.name || r.regions?.slug || '',
		};
	});

	cache.ranges.set(safeLang, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Peak details                                                        */
/* ------------------------------------------------------------------ */

export async function fetchPeakBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.peakBySlug.has(key)) return cache.peakBySlug.get(key);

	const { data, error } = await supabase
		.from('peaks')
		.select(
			`
      id,
      slug,
      elevation_m,
      latitude,
      longitude,
      difficulty,
      best_season,
      cover_image_url,
      is_korona,
      active,
      peaks_i18n!inner (
        name,
        short_description,
        description,
        tips,
        lang
      ),
      mountain_ranges (
        id,
        slug,
        mountain_ranges_i18n (
          name,
          description,
          lang
        ),
        countries (
          code,
          slug,
          flag_emoji,
          countries_i18n (
            name,
            lang
          )
        ),
        regions (
          slug,
          regions_i18n (
            name,
            lang
          )
        )
      )
    `,
		)
		.eq('slug', slug)
		.eq('active', true)
		.eq('peaks_i18n.lang', safeLang)
		.single();

	if (error) throw error;

	const i18n = first(data.peaks_i18n);
	const rangeI18n = (data.mountain_ranges?.mountain_ranges_i18n || []).find(
		(r) => r.lang === safeLang,
	);
	const country = data.mountain_ranges?.countries;
	const region = data.mountain_ranges?.regions;
	const countryI18n = translation(country?.countries_i18n, safeLang);
	const regionI18n = translation(region?.regions_i18n, safeLang);

	const mapped = {
		...data,
		name: i18n?.name || data.slug,
		peak_name: i18n?.name || data.slug,
		short_description: i18n?.short_description || '',
		description: i18n?.description || '',
		tips: i18n?.tips || '',
		range_id: data.mountain_ranges?.id,
		range_slug: data.mountain_ranges?.slug || '',
		range_name: rangeI18n?.name || '',
		country_code: country?.code || '',
		country_slug: country?.slug || '',
		country_name: countryI18n?.name || country?.slug || '',
		country_flag: country?.flag_emoji || '',
		region_slug: region?.slug || '',
		region_name: regionI18n?.name || region?.slug || '',
	};

	cache.peakBySlug.set(key, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Range details                                                       */
/* ------------------------------------------------------------------ */

export async function fetchRangeBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.rangeBySlug.has(key)) return cache.rangeBySlug.get(key);

	const { data, error } = await supabase
		.from('mountain_ranges')
		.select(
			`
      id,
      slug,
      mountain_ranges_i18n!inner (
        name,
        description,
        lang
      ),
      countries (
        code,
        slug,
        flag_emoji,
        countries_i18n (
          name,
          lang
        )
      ),
      regions (
        slug,
        regions_i18n (
          name,
          lang
        )
      ),
      peaks (
        id,
        slug,
        elevation_m,
        latitude,
        longitude,
        difficulty,
        best_season,
        cover_image_url,
        is_korona,
        active,
        peaks_i18n (
          name,
          short_description,
          lang
        )
      )
    `,
		)
		.eq('slug', slug)
		.eq('mountain_ranges_i18n.lang', safeLang)
		.single();

	if (error) throw error;

	const i18n = first(data.mountain_ranges_i18n);
	const countryI18n = translation(data.countries?.countries_i18n, safeLang);
	const regionI18n = translation(data.regions?.regions_i18n, safeLang);

	const peaks = (data.peaks || [])
		.filter((p) => p.active)
		.map((p) => {
			const pi = (p.peaks_i18n || []).find((x) => x.lang === safeLang);

			return {
				...p,
				name: pi?.name || p.slug,
				peak_name: pi?.name || p.slug,
				short_description: pi?.short_description || '',
				range_slug: data.slug,
				range_name: i18n?.name || data.slug,
			};
		})
		.sort((a, b) => (b.elevation_m || 0) - (a.elevation_m || 0));

	const mapped = {
		id: data.id,
		slug: data.slug,
		name: i18n?.name || data.slug,
		description: i18n?.description || '',
		country_code: data.countries?.code || '',
		country_slug: data.countries?.slug || '',
		country_name: countryI18n?.name || data.countries?.slug || '',
		country_flag: data.countries?.flag_emoji || '',
		region_slug: data.regions?.slug || '',
		region_name: regionI18n?.name || data.regions?.slug || '',
		peaks,
	};

	cache.rangeBySlug.set(key, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Trails by peak slug                                                 */
/* ------------------------------------------------------------------ */

export async function fetchPeakTrailsBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.trailsBySlug.has(key)) return cache.trailsBySlug.get(key);

	const peak = await fetchPeakBySlug(safeLang, slug);

	const { data, error } = await supabase
		.from('trails')
		.select(
			`
      id,
      slug,
      start_point_name,
      end_point_name,
      distance_km,
      elevation_gain_m,
      time_min,
      difficulty,
      route_type,
      gpx_url,
      map_url,
      active,
      trails_i18n (
        name,
        description,
        notes,
        lang
      )
    `,
		)
		.eq('peak_id', peak.id)
		.eq('active', true);

	if (error) throw error;

	const mapped = (data || []).map((t) => {
		const i18n = (t.trails_i18n || []).find((x) => x.lang === safeLang);

		return {
			...t,
			name: i18n?.name || t.slug,
			description: i18n?.description || '',
			notes: i18n?.notes || '',
		};
	});

	cache.trailsBySlug.set(key, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* POIs by peak slug                                                   */
/* ------------------------------------------------------------------ */

export async function fetchPeakPoisBySlug(lang, slug) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}`;

	if (cache.poisBySlug.has(key)) return cache.poisBySlug.get(key);

	const peak = await fetchPeakBySlug(safeLang, slug);

	const { data, error } = await supabase
		.from('pois')
		.select(
			`
      id,
      latitude,
      longitude,
      website_url,
      google_maps_url,
      active,
      pois_i18n (
        name,
        description,
        tips,
        lang
      ),
      poi_types (
        slug,
        poi_types_i18n (
          name,
          lang
        )
      )
    `,
		)
		.eq('peak_id', peak.id)
		.eq('active', true);

	if (error) throw error;

	const mapped = (data || []).map((poi) => {
		const i18n = (poi.pois_i18n || []).find((x) => x.lang === safeLang);
		const typeI18n = (poi.poi_types?.poi_types_i18n || []).find(
			(x) => x.lang === safeLang,
		);

		return {
			...poi,
			name: i18n?.name || '',
			description: i18n?.description || '',
			tips: i18n?.tips || '',
			type_slug: poi.poi_types?.slug || '',
			type_name: typeI18n?.name || '',
		};
	});

	cache.poisBySlug.set(key, mapped);
	return mapped;
}

/* ------------------------------------------------------------------ */
/* Nearby peaks                                                        */
/* ------------------------------------------------------------------ */

export async function fetchNearbyPeaksBySlug(lang, slug, limit = 6) {
	const safeLang = apiLang(lang);
	const key = `${safeLang}:${slug}:${limit}`;

	if (cache.nearbyBySlug.has(key)) return cache.nearbyBySlug.get(key);

	const peak = await fetchPeakBySlug(safeLang, slug);

	const { data, error } = await supabase
		.from('peak_nearby')
		.select(
			`
      nearby_peak_id,
      note,
      peaks!peak_nearby_nearby_peak_id_fkey (
        id,
        slug,
        elevation_m,
        latitude,
        longitude,
        active,
        peaks_i18n (
          name,
          lang
        )
      )
    `,
		)
		.eq('peak_id', peak.id)
		.limit(limit);

	if (error) throw error;

	const mapped = (data || [])
		.map((row) => {
			const p = row.peaks;
			const i18n = (p?.peaks_i18n || []).find((x) => x.lang === safeLang);

			return {
				id: p?.id,
				slug: p?.slug,
				name: i18n?.name || p?.slug,
				peak_name: i18n?.name || p?.slug,
				elevation_m: p?.elevation_m,
				latitude: p?.latitude,
				longitude: p?.longitude,
				note: row.note || '',
				distance_km: '',
			};
		})
		.filter((p) => p.slug);

	cache.nearbyBySlug.set(key, mapped);
	return mapped;
}

export function clearApiCache() {
	Object.values(cache).forEach((map) => map.clear());
}
