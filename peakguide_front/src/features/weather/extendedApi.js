const finite = value => typeof value === 'number' && Number.isFinite(value);
const zoneOK = zone => { try { return typeof zone === 'string' && Boolean(new Intl.DateTimeFormat('en', { timeZone: zone })); } catch { return false; } };
const dateOK = date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(date)) && new Date(date).toISOString().slice(0, 10) === date;
const instantOK = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) && /Z$/.test(value);
const metrics = ['temperature_min_c', 'temperature_max_c', 'weather_code', 'precipitation_sum_mm', 'precipitation_probability_max_percent', 'wind_max_kmh', 'gust_max_kmh', 'daylight_seconds'];

export class WeatherRequestError extends Error {
  constructor(code = 'unavailable') { super(code); this.code = code; }
}
async function json(path, params, signal) {
  const response = await fetch(`/.netlify/functions/${path}?${new URLSearchParams(params)}`, { signal, credentials: 'omit', headers: { Accept: 'application/json' } });
  if (!response.ok) {
    const code = response.status === 429 ? 'busy' : response.status === 404 ? 'unknown' : 'unavailable';
    throw new WeatherRequestError(code);
  }
  return response.json();
}
export async function searchWeatherCities(query, lang, signal) {
  const data = await json('weather-search', { q: query, lang }, signal);
  if (!Array.isArray(data?.results) || data.results.length > 8 || data.results.some(city => city?.kind !== 'city' || !Number.isSafeInteger(city.id) || city.id <= 0 || typeof city.name !== 'string' || !city.name.trim()
    || ![city.country, city.admin1].every(value => typeof value === 'string') || !zoneOK(city.time_zone))) throw new WeatherRequestError();
  return data.results;
}
export async function fetchDailyWeather(selection, lang, signal) {
  const data = await json('weather-forecast', { [selection.kind]: selection.value, lang }, signal);
  const location = data?.location;
  if (!location || location.kind !== selection.kind || (selection.kind === 'city' ? location.id !== Number(selection.value) : location.slug !== selection.value)
    || !zoneOK(data.time_zone) || !instantOK(data.retrieved_at) || !Array.isArray(data.days) || !data.days.length || data.days.length > 15
    || data.available_days !== data.days.length || !finite(location.latitude) || !finite(location.longitude) || (location.elevation_m !== null && !finite(location.elevation_m))
    || !finite(data.model_location?.latitude) || !finite(data.model_location?.longitude)
    || (selection.kind === 'city' && ![location.name, location.country, location.admin1].every(value => typeof value === 'string'))
    || data.days.some((day, i) => !dateOK(day?.date) || (i && day.date <= data.days[i - 1].date) || metrics.some(key => day[key] !== null && !finite(day[key]))
      || !['sunrise', 'sunset'].every(key => day[key] === null || instantOK(day[key]))
      || (day.temperature_min_c === null && day.temperature_max_c === null))) throw new WeatherRequestError();
  return data;
}
