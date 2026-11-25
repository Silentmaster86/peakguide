import { createForecastClient, ForecastError } from './forecast-client.mjs';
import { cityRecord, DAILY_VARIABLES, normalizeCities, normalizeDaily, validCityId, validPoint, validZone } from './forecast-data.mjs';

export const GEOCODING_SEARCH = 'https://geocoding-api.open-meteo.com/v1/search';
export const GEOCODING_CITY = 'https://geocoding-api.open-meteo.com/v1/get';
export const DAILY_FORECAST = 'https://api.open-meteo.com/v1/forecast';
const languages = { pl: 'pl', en: 'en', ua: 'uk', zh: 'zh' };
const CITY_SOURCE = { name: 'GeoNames via Open-Meteo', url: 'https://www.geonames.org/', license: 'https://creativecommons.org/licenses/by/4.0/' };

function parameters(request, allowed) {
  if (request.method !== 'GET') throw new ForecastError(405, 'method_not_allowed');
  if (request.url.length > 1024) throw new ForecastError(400, 'invalid_query');
  const params = new URL(request.url).searchParams;
  for (const key of params.keys()) if (!allowed.includes(key) || params.getAll(key).length !== 1) throw new ForecastError(400, 'invalid_query');
  const lang = params.has('lang') ? params.get('lang') : 'pl';
  if (!Object.hasOwn(languages, lang)) throw new ForecastError(400, 'invalid_query');
  return { params, lang };
}
function respond(status, body, seconds = 0, retryAfter = 0) {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
    'Cache-Control': status === 200 ? `public, max-age=${seconds}` : 'no-store',
    'Netlify-CDN-Cache-Control': status === 200 ? `public, s-maxage=${seconds}` : 'no-store' };
  if (status === 405) headers.Allow = 'GET';
  if (retryAfter > 0) headers['Retry-After'] = String(retryAfter);
  return Response.json(body, { status, headers });
}

export function createExtendedWeatherHandlers({ locations = {}, enabled = () => false, fetchImpl = fetch, clock = Date.now, clientOptions = {} } = {}) {
  const load = createForecastClient({ ...clientOptions, fetchImpl, clock });
  const ttl = expires => Math.max(0, Math.floor((expires - clock()) / 1000));
  const wrap = handler => async request => {
    try { return await handler(request); }
    catch (cause) {
      const error = cause instanceof ForecastError ? cause : new ForecastError(503, 'unavailable', 60);
      return respond(error.status, { error: error.code }, 0, error.retryAfter);
    }
  };
  function configured() { if (!enabled()) throw new ForecastError(503, 'not_configured'); }
  const search = wrap(async request => {
    const { params, lang } = parameters(request, ['q', 'lang']);
    const query = (params.get('q') || '').normalize('NFC').trim().replace(/\s+/gu, ' ');
    if ([...query].length < 2 || [...query].length > 80 || /\p{C}/u.test(query) || !/[\p{L}\p{N}]/u.test(query)) throw new ForecastError(400, 'invalid_query');
    configured();
    const url = new URL(GEOCODING_SEARCH);
    url.search = new URLSearchParams({ name: query, language: languages[lang], count: '8', format: 'json' });
    const result = await load(url, normalizeCities, 6 * 3600_000, undefined, 'invalid_query');
    return respond(200, { results: result.value, source: CITY_SOURCE }, ttl(result.expires));
  });
  const forecast = wrap(async request => {
    const { params, lang } = parameters(request, ['peak', 'city', 'lang']);
    const slug = params.get('peak'), city = params.get('city');
    if ((slug !== null) === (city !== null)) throw new ForecastError(400, 'invalid_query');
    let point;
    if (slug !== null) {
      if (!Object.hasOwn(locations, slug)) throw new ForecastError(404, 'unknown_peak');
      point = { ...locations[slug], kind: 'peak', slug };
      if (!validPoint(point) || !validZone(point.time_zone) || !Number.isFinite(point.elevation_m) || point.elevation_m < -500 || point.elevation_m > 10000) throw new ForecastError(404, 'unknown_peak');
    } else if (!/^\d{1,10}$/.test(city) || !validCityId(Number(city))) throw new ForecastError(400, 'invalid_query');
    configured();
    if (city !== null) {
      const url = new URL(GEOCODING_CITY);
      url.search = new URLSearchParams({ id: String(Number(city)), language: languages[lang] });
      point = (await load(url, data => {
        if (data?.id !== Number(city)) throw new Error('Wrong city response');
        const result = cityRecord(data);
        if (!result) throw new ForecastError(404, 'unknown_city');
        return result;
      }, 24 * 3600_000, 'unknown_city')).value;
    }
    const url = new URL(DAILY_FORECAST);
    url.search = new URLSearchParams({ latitude: String(point.latitude), longitude: String(point.longitude), timezone: point.time_zone,
      daily: DAILY_VARIABLES, forecast_days: '15', timeformat: 'unixtime', temperature_unit: 'celsius', wind_speed_unit: 'kmh', precipitation_unit: 'mm' });
    if (point.elevation_m !== null) url.searchParams.set('elevation', String(point.elevation_m));
    const result = await load(url, (data, now) => normalizeDaily(data, point, now), (value, now) => {
      const midnight = value.days.map(day => Date.parse(day.period_start)).find(time => time > now);
      return Math.max(1, Math.min(10 * 60_000, midnight ? midnight - now : Infinity));
    });
    return respond(200, { ...result.value, location: point }, ttl(result.expires));
  });
  return { search, forecast };
}
