const DAY = 86_400_000;
const finite = value => typeof value === 'number' && Number.isFinite(value);
const range = (value, min, max) => finite(value) && value >= min && value <= max;
const text = value => typeof value === 'string' && value.trim().length <= 160 && !/\p{C}/u.test(value) ? value.trim() : '';
export const validZone = value => {
  try { return typeof value === 'string' && value.length <= 80 && /^(UTC|GMT|[A-Za-z_+-]+(?:\/[A-Za-z0-9_+-]+)+)$/.test(value) && new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone; }
  catch { return false; }
};
export const validPoint = point => range(point?.latitude, -90, 90) && range(point?.longitude, -180, 180);
export const validCityId = id => Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647;

export function cityRecord(row) {
  if (!validCityId(row?.id) || !validPoint(row) || !text(row.name) || !validZone(row.timezone)
    || !/^PPL/.test(row.feature_code || '') || !/^[A-Z]{2}$/.test(row.country_code || '')) return null;
  return { kind: 'city', id: row.id, name: text(row.name), country: text(row.country) || row.country_code,
    country_code: row.country_code, admin1: text(row.admin1), latitude: row.latitude, longitude: row.longitude,
    elevation_m: range(row.elevation, -500, 9000) ? row.elevation : null, time_zone: row.timezone };
}

export function normalizeCities(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.error || (data.results !== undefined && !Array.isArray(data.results))) throw new Error('Invalid locations');
  const seen = new Set();
  return (data.results || []).slice(0, 100).map(cityRecord).filter(city => {
    if (!city || seen.has(city.id)) return false;
    seen.add(city.id);
    return true;
  }).slice(0, 8);
}

const fields = {
  temperature_min_c: ['temperature_2m_min', '°C', -150, 100],
  temperature_max_c: ['temperature_2m_max', '°C', -150, 100],
  weather_code: ['weather_code', 'wmo code', 0, 99],
  precipitation_sum_mm: ['precipitation_sum', 'mm', 0, 10000],
  precipitation_probability_max_percent: ['precipitation_probability_max', '%', 0, 100],
  wind_max_kmh: ['wind_speed_10m_max', 'km/h', 0, 1000],
  gust_max_kmh: ['wind_gusts_10m_max', 'km/h', 0, 1000],
  daylight_seconds: ['daylight_duration', 's', 0, 86400],
};
export const DAILY_VARIABLES = [...Object.values(fields).map(([key]) => key), 'sunrise', 'sunset'].join(',');
const wmoCodes = new Set([0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 97, 99]);
function calendarDate(now, zone) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(now));
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function currentOffset(now, zone) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now));
  const get = type => Number(parts.find(part => part.type === type).value);
  return (Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second')) - Math.floor(now / 1000) * 1000) / 1000;
}

export function normalizeDaily(data, point, now) {
  const daily = data?.daily, units = data?.daily_units, times = daily?.time;
  if (data?.error || !validPoint(data) || !range(data.elevation, -500, 10000) || !validZone(data.timezone)
    || validZone(data.timezone) !== validZone(point.time_zone) || !Number.isInteger(data.utc_offset_seconds)
    || Math.abs(data.utc_offset_seconds) > 14 * 3600 || data.utc_offset_seconds !== currentOffset(now, point.time_zone)
    || !Array.isArray(times) || !times.length || times.length > 15
    || units?.time !== 'unixtime') throw new Error('Invalid forecast');
  const radians = degrees => degrees * Math.PI / 180;
  const a = Math.sin(radians(data.latitude - point.latitude) / 2) ** 2
    + Math.cos(radians(data.latitude)) * Math.cos(radians(point.latitude)) * Math.sin(radians(data.longitude - point.longitude) / 2) ** 2;
  if (6371 * 2 * Math.asin(Math.min(1, Math.sqrt(a))) > 100
    || (finite(point.elevation_m) && Math.abs(data.elevation - point.elevation_m) > 1)) throw new Error('Wrong forecast location/elevation');
  for (const [field, unit] of [...Object.values(fields), ['sunrise', 'unixtime'], ['sunset', 'unixtime']]) {
    if (daily[field] === undefined && field !== 'temperature_2m_min' && field !== 'temperature_2m_max') continue;
    if (units[field] !== unit || !Array.isArray(daily[field]) || daily[field].length !== times.length) throw new Error('Invalid forecast units/arrays');
  }
  const days = times.map((seconds, i) => {
    if (!Number.isInteger(seconds) || seconds * 1000 < now - 36 * 3600_000 || seconds * 1000 > now + 16 * DAY
      || (i && seconds - times[i - 1] !== 86400)) throw new Error('Invalid forecast dates');
    // Daily aggregates use the provider's fixed UTC offset. Preserve their date
    // labels; event instants are separate UTC values to format in the IANA zone.
    const labelDate = new Date((seconds + data.utc_offset_seconds) * 1000);
    if (labelDate.getUTCHours() || labelDate.getUTCMinutes() || labelDate.getUTCSeconds()) throw new Error('Invalid daily boundary');
    const date = labelDate.toISOString().slice(0, 10);
    if (!i && date !== calendarDate(now, point.time_zone)) throw new Error('Outdated forecast');
    const row = { date, period_start: new Date(seconds * 1000).toISOString(), period_end: new Date(seconds * 1000 + DAY).toISOString() };
    for (const [name, [key, , min, max]] of Object.entries(fields)) {
      const value = daily[key]?.[i];
      if (value == null) row[name] = null;
      else {
        if (!range(value, min, max)) throw new Error('Invalid metric');
        row[name] = name === 'weather_code' && !wmoCodes.has(value) ? null : value;
      }
    }
    if (row.temperature_min_c !== null && row.temperature_max_c !== null && row.temperature_min_c > row.temperature_max_c) throw new Error('Invalid temperature range');
    for (const key of ['sunrise', 'sunset']) {
      const value = daily[key]?.[i];
      if (value == null || value === 0) row[key] = null; // Polar events must not become 1970 dates.
      else {
        if (!range(value, seconds - 12 * 3600, seconds + 36 * 3600)) throw new Error('Invalid solar event');
        row[key] = new Date(value * 1000).toISOString();
      }
    }
    return row;
  }).filter(row => row.temperature_min_c !== null || row.temperature_max_c !== null);
  if (!days.length) throw new Error('Empty forecast');
  return { retrieved_at: new Date(now).toISOString(), time_zone: data.timezone, period_utc_offset_seconds: data.utc_offset_seconds,
    model_location: { latitude: data.latitude, longitude: data.longitude, elevation_m: data.elevation },
    available_days: days.length, days,
    source: { name: 'Open-Meteo', url: 'https://open-meteo.com/', license: 'https://creativecommons.org/licenses/by/4.0/' } };
}
