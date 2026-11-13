import { supabase } from '../../lib/supabaseClient';
import { invalidatePeakGuideCache } from '../../api/peakguide';
import { preparePeakPayload } from './validation';
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

async function savePeak(id, body) {
  const payload = preparePeakPayload(body);
  const { data, error } = await supabase.rpc('admin_save_peak', { p_peak_id: id, p_body: payload });
  if (error) throw new Error(error.message);
  invalidatePeakGuideCache();
  return { item: { id: data }, ok: true };
}

export function adminCreatePeak(body) { return savePeak(null, body); }
export function adminUpdatePeak(id, body) {
  const peakId = Number(id);
  if (!Number.isInteger(peakId) || peakId <= 0) throw new Error('Invalid peak id');
  return savePeak(peakId, body);
}

export async function adminDeletePeak(id) {
  const peakId = Number(id);

  if (!Number.isInteger(peakId) || peakId <= 0) {
    throw new Error('Invalid peak id');
  }

  const { error } = await supabase.rpc('admin_delete_peak', {
    p_peak_id: peakId,
  });

  if (error) throw new Error(error.message);

	invalidatePeakGuideCache();

  return { ok: true };
}
