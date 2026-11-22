export async function fetchPeakWeather(slug, signal) {
  const response = await fetch('/.netlify/functions/peak-weather?' + new URLSearchParams({ peak: slug }), { signal });
  if (!response.ok) throw new Error('Forecast unavailable');
  const body = await response.json();
  const date = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
  const number = value => typeof value === 'number' && Number.isFinite(value);
  if (body.peak !== slug || !date(body.updated_at) || !date(body.retrieved_at)
    || !number(body.location?.latitude) || !number(body.location?.longitude)
    || !Array.isArray(body.forecast) || !body.forecast.length
    || body.forecast.some(step => !date(step.time) || !number(step.temperature_c)
      || ['wind_kmh', 'gust_kmh', 'precipitation_mm_next_hour'].some(field => step[field] !== null && !number(step[field])))) {
    throw new Error('Invalid forecast');
  }
  if (!body.forecast.some(step => Date.parse(step.time) >= Date.now()) || Date.parse(body.updated_at) < Date.now() - 48 * 3600_000) throw new Error('Expired forecast');
  try { new Intl.DateTimeFormat('en', { timeZone: body.location.time_zone || 'UTC' }); } catch { throw new Error('Invalid time zone'); }
  return body;
}
