// MET Norway Locationforecast adapter. No cookies, accounts, API keys or client IP forwarding.
export const PROVIDER = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const USER_AGENT = 'PeakGuide/1.0 github.com/Silentmaster86/peakguide';
const MINUTE = 60_000;
const finite = (value) => typeof value === 'number' && Number.isFinite(value);
const nullable = (value) => finite(value) ? value : null;

export function normalizeForecast(data, now) {
  const { meta, timeseries } = data?.properties || {};
  const updated = Date.parse(meta?.updated_at);
  const coords = data?.geometry?.coordinates;
  if (!Number.isFinite(updated) || updated < now - 48 * 60 * MINUTE || updated > now + 10 * MINUTE
    || !Array.isArray(coords) || !coords.slice(0, 2).every(finite) || coords.length < 2
    || Math.abs(coords[0]) > 180 || Math.abs(coords[1]) > 90
    || meta?.units?.air_temperature !== 'celsius' || meta?.units?.wind_speed !== 'm/s'
    || !Array.isArray(timeseries)) throw new Error('Invalid forecast');
  const forecast = timeseries.flatMap((step) => {
    const time = Date.parse(step?.time);
    const details = step?.data?.instant?.details;
    if (!Number.isFinite(time) || time < now - 60 * MINUTE || time > now + 72 * 60 * MINUTE
      || !finite(details?.air_temperature)) return [];
    const rain = step.data.next_1_hours?.details;
    const precipitation = meta.units.precipitation_amount === 'mm' ? nullable(rain?.precipitation_amount) : null;
    return [{
      time: new Date(time).toISOString(), temperature_c: details.air_temperature,
      wind_kmh: finite(details.wind_speed) && details.wind_speed >= 0 ? Math.round(details.wind_speed * 36) / 10 : null,
      gust_kmh: meta.units.wind_speed_of_gust === 'm/s' && finite(details.wind_speed_of_gust) && details.wind_speed_of_gust >= 0
        ? Math.round(details.wind_speed_of_gust * 36) / 10 : null,
      precipitation_mm_next_hour: precipitation !== null && precipitation >= 0 ? precipitation : null,
    }];
  }).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (!forecast.some(step => Date.parse(step.time) >= now)) throw new Error('No future forecast');
  return {
    location: { latitude: coords[1], longitude: coords[0], elevation_m: nullable(coords[2]) },
    updated_at: new Date(updated).toISOString(), retrieved_at: new Date(now).toISOString(),
    forecast: forecast.filter((step, index) => !index || step.time !== forecast[index - 1].time),
  };
}

export function createWeatherHandler({ locations, enabled = () => false, fetchImpl = fetch, clock = Date.now } = {}) {
  const cache = new Map();
  const pending = new Map();
  let lastRequests = [];
  function respond(status, payload, ttl = 0) {
    return new Response(JSON.stringify(payload), { status, headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': status === 200 ? `public, max-age=${ttl}` : 'no-store',
      'Netlify-CDN-Cache-Control': status === 200 ? `public, s-maxage=${ttl}` : 'no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  }
  async function load(slug, point, previous) {
    const now = clock();
    const recent = lastRequests.filter(time => time > now - 1000);
    if (recent.length >= 5 || pending.size >= 8) return { error: 'busy', status: 429, expires: now + MINUTE };
    lastRequests = [...recent, now];
    const url = new URL(PROVIDER);
    url.search = new URLSearchParams({
      lat: String(Math.trunc(point.latitude * 10000) / 10000),
      lon: String(Math.trunc(point.longitude * 10000) / 10000),
      altitude: String(Math.round(point.elevation_m)),
    });
    try {
      const headers = { 'User-Agent': USER_AGENT, Accept: 'application/json' };
      if (previous?.lastModified) headers['If-Modified-Since'] = previous.lastModified;
      const response = await fetchImpl(url, { headers, signal: AbortSignal.timeout(8000), redirect: 'error' });
      const expiresAt = Date.parse(response.headers.get('Expires'));
      const expires = Number.isFinite(expiresAt) && expiresAt > now ? expiresAt : now + 10 * MINUTE;
      if (response.status === 304 && previous?.body) {
        // An unchanged model can still become too old to display.
        if (Date.parse(previous.body.updated_at) < now - 48 * 60 * MINUTE) throw new Error('Stale model');
        return { ...previous, expires };
      }
      if (![200, 203].includes(response.status)) {
        const retry = response.headers.get('Retry-After');
        const retryAt = /^\d+$/.test(retry || '') ? now + Number(retry) * 1000 : Date.parse(retry);
        return { error: 'unavailable', status: 503, expires: Math.max(now + MINUTE, Number.isFinite(retryAt) ? retryAt : 0) };
      }
      const text = await response.text();
      if (text.length > 1_000_000) throw new Error('Response too large');
      const body = { ...normalizeForecast(JSON.parse(text), now), peak: slug,
        deprecated: response.status === 203,
        source: { name: 'MET Norway', url: 'https://www.met.no/en', license: 'https://creativecommons.org/licenses/by/4.0/' } };
      // Discard expired entries first; the allowlist also bounds possible keys.
      if (cache.size >= 100) for (const [key, value] of cache) if (value.expires <= now) cache.delete(key);
      return { body, expires, lastModified: response.headers.get('Last-Modified') };
    } catch {
      return { error: 'unavailable', status: 503, expires: now + MINUTE };
    }
  }
  return async function handler(request) {
    if (request.method !== 'GET') return respond(405, { error: 'method_not_allowed' });
    const url = new URL(request.url);
    const slug = url.searchParams.get('peak');
    if (url.searchParams.size !== 1 || !slug) return respond(400, { error: 'invalid_peak' });
    const point = Object.hasOwn(locations, slug) && locations[slug];
    if (!point) return respond(404, { error: 'unknown_peak' });
    if (!enabled()) return respond(503, { error: 'not_configured' });
    let value = cache.get(slug);
    if (!value || value.expires <= clock()) {
      if (!pending.has(slug)) pending.set(slug, load(slug, point, value).then(result => { cache.set(slug, result); return result; }).finally(() => pending.delete(slug)));
      value = await pending.get(slug);
    }
    if (value.error) return respond(value.status, { error: value.error });
    return respond(200, value.body, Math.max(0, Math.floor((value.expires - clock()) / 1000)));
  };
}
