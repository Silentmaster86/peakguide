import { supabase } from '../../lib/supabaseClient';

const LANGS = ['pl', 'en', 'ua', 'zh'];

function normalizeLang(lang) {
	return LANGS.includes(lang) ? lang : 'pl';
}

function emptyI18n() {
	return LANGS.reduce((acc, l) => {
		acc[l] = {
			name: '',
			short_description: '',
			description: '',
			tips: '',
		};
		return acc;
	}, {});
}

function mapPeak(row, lang = 'pl') {
	const i18nRows = row.peaks_i18n || [];
	const current = i18nRows.find((x) => x.lang === lang) || i18nRows[0];

	const rangeI18n =
		row.mountain_ranges?.mountain_ranges_i18n?.find((x) => x.lang === lang) ||
		row.mountain_ranges?.mountain_ranges_i18n?.[0];

	const i18n = emptyI18n();

	for (const l of LANGS) {
		const r = i18nRows.find((x) => x.lang === l);
		if (r) {
			i18n[l] = {
				name: r.name || '',
				short_description: r.short_description || '',
				description: r.description || '',
				tips: r.tips || '',
			};
		}
	}

	return {
		id: String(row.id),
		slug: row.slug,
		range_id: row.range_id ? String(row.range_id) : '',
		range_slug: row.mountain_ranges?.slug || '',
		range_name: rangeI18n?.name || row.mountain_ranges?.slug || '',
		subrange_id: row.subrange_id ? String(row.subrange_id) : '',
		elevation_m: row.elevation_m,
		latitude: row.latitude,
		longitude: row.longitude,
		difficulty: row.difficulty,
		best_season: row.best_season,
		cover_image_url: row.cover_image_url,
		cover_image_author: row.cover_image_author,
		cover_image_source_url: row.cover_image_source_url,
		cover_image_license: row.cover_image_license,
		cover_image_license_url: row.cover_image_license_url,
		is_korona: row.is_korona,
		active: row.active,
		created_at: row.created_at,
		name: current?.name || row.slug,
		lang,
		i18n,
	};
}

export async function adminFetchPeaks({ lang = 'pl', q = '' }) {
	const safeLang = normalizeLang(lang);
	const search = String(q || '')
		.trim()
		.toLowerCase();

	const { data, error } = await supabase
		.from('peaks')
		.select(
			`
			id,
			slug,
			range_id,
			subrange_id,
			elevation_m,
			latitude,
			longitude,
			difficulty,
			best_season,
			cover_image_url,
			cover_image_author,
			cover_image_source_url,
			cover_image_license,
			cover_image_license_url,
			is_korona,
			active,
			created_at,
			peaks_i18n (
				lang,
				name,
				short_description,
				description,
				tips
			),
			mountain_ranges (
				id,
				slug,
				mountain_ranges_i18n (
					lang,
					name
				)
			)
		`,
		)
		.order('elevation_m', { ascending: false });

	if (error) throw new Error(error.message);

	let items = (data || []).map((row) => mapPeak(row, safeLang));

	if (search) {
		items = items.filter((p) => {
			return (
				String(p.slug || '')
					.toLowerCase()
					.includes(search) ||
				String(p.name || '')
					.toLowerCase()
					.includes(search) ||
				String(p.range_name || '')
					.toLowerCase()
					.includes(search)
			);
		});
	}

	return { items };
}

export async function adminCreatePeak(body) {
	const { i18n, ...peakData } = body;

	const { data: peak, error: peakError } = await supabase
		.from('peaks')
		.insert({
			slug: peakData.slug,
			range_id: Number(peakData.range_id),
			subrange_id: peakData.subrange_id ? Number(peakData.subrange_id) : null,
			elevation_m: Number(peakData.elevation_m),
			latitude: peakData.latitude ?? null,
			longitude: peakData.longitude ?? null,
			difficulty: peakData.difficulty || null,
			best_season: peakData.best_season || null,
			cover_image_url: peakData.cover_image_url || null,
			cover_image_author: peakData.cover_image_author || null,
			cover_image_source_url: peakData.cover_image_source_url || null,
			cover_image_license: peakData.cover_image_license || null,
			cover_image_license_url: peakData.cover_image_license_url || null,
			is_korona: !!peakData.is_korona,
			active: !!peakData.active,
		})
		.select('id')
		.single();

	if (peakError) throw new Error(peakError.message);

	const rows = LANGS.map((lang) => ({
		peak_id: peak.id,
		lang,
		name: i18n?.[lang]?.name || body.slug,
		short_description: i18n?.[lang]?.short_description || null,
		description: i18n?.[lang]?.description || null,
		tips: i18n?.[lang]?.tips || null,
	}));

	const { error: i18nError } = await supabase.from('peaks_i18n').insert(rows);

	if (i18nError) throw new Error(i18nError.message);

	return { item: peak };
}

export async function adminUpdatePeak(id, body) {
	const { i18n, ...peakData } = body;

	const { error: peakError } = await supabase
		.from('peaks')
		.update({
			slug: peakData.slug,
			range_id: Number(peakData.range_id),
			subrange_id: peakData.subrange_id ? Number(peakData.subrange_id) : null,
			elevation_m: Number(peakData.elevation_m),
			latitude: peakData.latitude ?? null,
			longitude: peakData.longitude ?? null,
			difficulty: peakData.difficulty || null,
			best_season: peakData.best_season || null,
			cover_image_url: peakData.cover_image_url || null,
			cover_image_author: peakData.cover_image_author || null,
			cover_image_source_url: peakData.cover_image_source_url || null,
			cover_image_license: peakData.cover_image_license || null,
			cover_image_license_url: peakData.cover_image_license_url || null,
			is_korona: !!peakData.is_korona,
			active: !!peakData.active,
		})
		.eq('id', id);

	if (peakError) throw new Error(peakError.message);

	const rows = LANGS.map((lang) => ({
		peak_id: Number(id),
		lang,
		name: i18n?.[lang]?.name || body.slug,
		short_description: i18n?.[lang]?.short_description || null,
		description: i18n?.[lang]?.description || null,
		tips: i18n?.[lang]?.tips || null,
	}));

	const { error: i18nError } = await supabase.from('peaks_i18n').upsert(rows, {
		onConflict: 'peak_id,lang',
	});

	if (i18nError) throw new Error(i18nError.message);

	return { ok: true };
}

export async function adminDeletePeak(id) {
	const peakId = Number(id);

	const { error: i18nError } = await supabase
		.from('peaks_i18n')
		.delete()
		.eq('peak_id', peakId);

	if (i18nError) throw new Error(i18nError.message);

	const { error: peakError } = await supabase
		.from('peaks')
		.delete()
		.eq('id', peakId);

	if (peakError) throw new Error(peakError.message);

	return { ok: true };
}
