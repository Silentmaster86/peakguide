const LANGS = ['pl', 'en', 'ua', 'zh'];
function numeric(value) {
  if (value == null || String(value).trim() === '') return null;
  if (typeof value === 'boolean') return NaN;
  return Number(value);
}
export function preparePeakPayload(body) {
  const slug = String(body.slug || '').trim();
  const range = numeric(body.range_id);
  const subrange = numeric(body.subrange_id);
  const elevation = numeric(body.elevation_m);
  const latitude = numeric(body.latitude);
  const longitude = numeric(body.longitude);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Slug: use lowercase letters, digits and hyphens.');
  if (!Number.isInteger(range) || range <= 0) throw new Error('Select a mountain range.');
  if (subrange !== null && (!Number.isInteger(subrange) || subrange <= 0)) throw new Error('Invalid subrange.');
  if (elevation === null || !Number.isFinite(elevation) || elevation < -500 || elevation > 9000) throw new Error('Enter an elevation between -500 and 9000 m.');
  if ((latitude === null) !== (longitude === null) || (latitude !== null && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180))) throw new Error('Enter both valid coordinates, or leave both empty.');
  const i18n = {};
  for (const lang of LANGS) {
    const row = body.i18n?.[lang];
    if (!row) continue;
    const fields = Object.fromEntries(['name', 'short_description', 'description', 'tips'].map((key) => [key, String(row[key] || '').trim()]));
    if (Object.values(fields).some(Boolean) && !fields.name) throw new Error(`Add a name for the ${lang.toUpperCase()} translation.`);
    if (fields.name) i18n[lang] = fields;
  }
  if (!Object.keys(i18n).length) throw new Error('Add at least one named translation.');
  const payload = { slug, range_id: range, subrange_id: subrange, elevation_m: elevation, latitude, longitude, i18n, is_korona: body.is_korona === true, active: body.active === true };
  for (const field of ['difficulty', 'best_season', 'cover_image_url', 'cover_image_author', 'cover_image_source_url', 'cover_image_license', 'cover_image_license_url']) payload[field] = String(body[field] || '').trim() || null;
  return payload;
}
