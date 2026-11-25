import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createExtendedWeatherHandlers, GEOCODING_CITY, GEOCODING_SEARCH, DAILY_FORECAST } from './extended-weather.mjs';
import { cityRecord, normalizeCities, normalizeDaily, DAILY_VARIABLES } from './forecast-data.mjs';
import { createForecastClient } from './forecast-client.mjs';

const NOW = Date.parse('2026-11-25T10:00:00Z');
const DAY = 86400;
const city = { id: 2950159, name: 'Berlin', country: 'Germany', country_code: 'DE', admin1: 'Berlin', latitude: 52.52437, longitude: 13.41053, elevation: 74, feature_code: 'PPLC', timezone: 'Europe/Berlin' };
const berlin = cityRecord(city);
const locations = { summit: { latitude: berlin.latitude, longitude: berlin.longitude, elevation_m: 74, time_zone: berlin.time_zone } };
function fixture({ now = NOW, offset = 3600, point = berlin, count = 15 } = {}) {
  const first = Math.floor((now / 1000 + offset) / DAY) * DAY - offset;
  const time = Array.from({ length: count }, (_, i) => first + i * DAY);
  const daily = { time, temperature_2m_min: time.map(() => -4), temperature_2m_max: time.map(() => 5),
    weather_code: time.map(() => 3), precipitation_sum: time.map(() => 0), precipitation_probability_max: time.map(() => 10),
    wind_speed_10m_max: time.map(() => 20), wind_gusts_10m_max: time.map(() => 35),
    daylight_duration: time.map(() => 9 * 3600), sunrise: time.map(t => t + 7 * 3600), sunset: time.map(t => t + 16 * 3600) };
  const daily_units = Object.fromEntries(DAILY_VARIABLES.split(',').map(key => [key, ({ temperature_2m_min: '°C', temperature_2m_max: '°C', weather_code: 'wmo code',
    precipitation_sum: 'mm', precipitation_probability_max: '%', wind_speed_10m_max: 'km/h', wind_gusts_10m_max: 'km/h', daylight_duration: 's', sunrise: 'unixtime', sunset: 'unixtime' })[key]]));
  return { latitude: point.latitude + .01, longitude: point.longitude, elevation: point.elevation_m ?? 100,
    timezone: point.time_zone, utc_offset_seconds: offset, daily, daily_units: { ...daily_units, time: 'unixtime' } };
}
const request = (path, query, method = 'GET') => new Request(`https://peak-guide.netlify.app/.netlify/functions/weather-${path}?${query}`, { method, headers: { Cookie: 'private-account-cookie', 'X-Forwarded-For': '192.0.2.1' } });
const search = (h, query = 'q=Berlin&lang=en') => h.search(request('search', query));
const forecast = (h, query = 'peak=summit') => h.forecast(request('forecast', query));
function harness(options = {}) {
  const state = { calls: [], now: NOW };
  state.handlers = createExtendedWeatherHandlers({ locations, enabled: () => true, clock: () => state.now,
    fetchImpl: async (url, init) => {
      state.calls.push({ url: new URL(url), init });
      if (url.origin + url.pathname === GEOCODING_SEARCH) return Response.json({ results: [city] });
      if (url.origin + url.pathname === GEOCODING_CITY) return Response.json({ ...city, name: url.searchParams.get('language') === 'uk' ? 'Берлін' : city.name });
      return Response.json(fixture({ now: state.now }));
    }, ...options });
  return state;
}

test('invalid requests, disabled service and unknown peaks never request upstream data', async () => {
  let calls = 0;
  const h = createExtendedWeatherHandlers({ locations, fetchImpl: () => { calls++; throw new Error('must not call'); } });
  for (const q of ['', 'q=B', 'q=Berlin&lang=', 'q=Berlin&lang=uk', 'q=Berlin&q=Paris', 'q=Berlin&url=https://evil.test', `q=${'a'.repeat(81)}`, 'q=Be%00rlin']) {
    assert.equal((await search(h, q)).status, 400, q);
  }
  for (const q of ['', 'lat=52&lon=13', 'peak=summit&city=2950159', 'peak=summit&peak=summit', 'city=-1', 'city=1.5', 'city=0', 'city=2147483648', 'city=abc']) assert.equal((await forecast(h, q)).status, 400, q);
  assert.equal((await forecast(h, 'peak=__proto__')).status, 404);
  assert.equal((await forecast(h, 'peak=unknown')).status, 404);
  assert.equal((await search(h)).status, 503);
  assert.equal((await forecast(h)).status, 503);
  assert.equal((await forecast(h, 'city=2950159')).status, 503);
  for (const method of ['POST', 'DELETE', 'OPTIONS']) {
    const r = await h.search(request('search', 'q=Berlin', method));
    assert.equal(r.status, 405); assert.equal(r.headers.get('Allow'), 'GET');
  }
  assert.equal(calls, 0);
});

test('search supports Chinese two-character names, language mapping and literal query encoding', async () => {
  const s = harness();
  const r = await search(s.handlers, 'q=%E5%8C%97%E4%BA%AC&lang=ua');
  assert.equal(r.status, 200);
  assert.equal(s.calls[0].url.origin + s.calls[0].url.pathname, GEOCODING_SEARCH);
  assert.equal(s.calls[0].url.searchParams.get('name'), '北京');
  assert.equal(s.calls[0].url.searchParams.get('language'), 'uk');
  assert.equal(s.calls[0].url.searchParams.get('count'), '8');
  const data = await r.json();
  assert.equal(data.results[0].time_zone, 'Europe/Berlin');
  assert.equal(data.results[0].admin1, 'Berlin');
  assert.equal(data.source.name, 'GeoNames via Open-Meteo');
  assert.equal(r.headers.get('Cache-Control'), 'public, max-age=21600');
  await search(s.handlers, 'q=A%26B&lang=pl');
  assert.equal(s.calls[1].url.searchParams.get('name'), 'A&B');
  assert.equal(s.calls[1].url.searchParams.size, 4);
  for (const { init } of s.calls) {
    assert.deepEqual(Object.keys(init.headers).sort(), ['Accept', 'User-Agent']);
    assert.equal(init.redirect, 'error');
    assert.ok(init.signal instanceof AbortSignal);
  }
});

test('city normalization rejects missing coordinates/zones, keeps valid zero coordinates and ambiguous distinct places', () => {
  const rows = [city, city, { ...city, id: 2, admin1: 'Other region' }, { ...city, id: 3, latitude: null }, { ...city, id: 4, timezone: 'bad/zone' },
    { ...city, id: 5, feature_code: 'MT' }, { ...city, id: 6, longitude: null }, { ...city, id: 7, latitude: 0, longitude: 0, elevation: 0 }];
  assert.deepEqual(normalizeCities({ results: rows }).map(row => row.id), [city.id, 2, 7]);
  assert.equal(normalizeCities({ results: rows }).at(-1).elevation_m, 0);
  assert.deepEqual(normalizeCities({}), []);
  assert.throws(() => normalizeCities({ results: 'invalid' }));
  assert.throws(() => normalizeCities([]));
  assert.equal(cityRecord({ ...city, timezone: 'PST' }), null);
});

test('deduplicates simultaneous searches, uses TTL and bounds cache eviction', async () => {
  const s = harness({ clientOptions: { maxEntries: 2 } });
  const responses = await Promise.all([search(s.handlers), search(s.handlers)]);
  assert.equal(responses[0].status, 200); assert.equal(s.calls.length, 1);
  s.now += 3600_000;
  assert.equal((await search(s.handlers)).headers.get('Cache-Control'), 'public, max-age=18000');
  await search(s.handlers, 'q=Paris'); await search(s.handlers); await search(s.handlers, 'q=London');
  assert.equal(s.calls.length, 3);
  await search(s.handlers, 'q=Paris'); assert.equal(s.calls.length, 4);
  s.now += 6 * 3600_000;
  await search(s.handlers, 'q=Paris'); assert.equal(s.calls.length, 5);
});

test('city forecast resolves server-side metadata and shares model cache without mixing localized names or peak identity', async () => {
  const s = harness();
  const english = await (await forecast(s.handlers, 'city=2950159&lang=en')).json();
  assert.equal(english.location.name, 'Berlin');
  const ukrainian = await (await forecast(s.handlers, 'city=2950159&lang=ua')).json();
  assert.equal(ukrainian.location.name, 'Берлін');
  const peak = await (await forecast(s.handlers)).json();
  assert.equal(peak.location.kind, 'peak'); assert.equal(peak.location.slug, 'summit');
  assert.equal(peak.days.length, 15); assert.equal(peak.days[0].precipitation_sum_mm, 0);
  assert.equal(peak.retrieved_at, new Date(NOW).toISOString());
  assert.equal(Object.hasOwn(peak, 'updated_at'), false);
  assert.notEqual(peak.model_location.latitude, peak.location.latitude);
  const modelCalls = s.calls.filter(c => c.url.origin + c.url.pathname === DAILY_FORECAST);
  assert.equal(modelCalls.length, 1);
  assert.equal(modelCalls[0].url.searchParams.get('forecast_days'), '15');
  assert.equal(modelCalls[0].url.searchParams.get('elevation'), '74');
  assert.equal(modelCalls[0].url.searchParams.get('timeformat'), 'unixtime');
  assert.equal(modelCalls[0].url.searchParams.get('daily'), DAILY_VARIABLES);
  assert.equal(s.calls[0].url.searchParams.get('id'), String(city.id));
});

test('null city elevation uses model DEM rather than inventing a zero', async () => {
  const h = createExtendedWeatherHandlers({ enabled: () => true, clock: () => NOW, fetchImpl: async url => {
    if (url.origin + url.pathname === GEOCODING_CITY) return Response.json({ ...city, elevation: null });
    assert.equal(url.searchParams.has('elevation'), false);
    return Response.json({ ...fixture(), elevation: 110 });
  } });
  const r = await forecast(h, 'city=2950159');
  assert.equal(r.status, 200);
  const data = await r.json();
  assert.equal(data.location.elevation_m, null); assert.equal(data.model_location.elevation_m, 110);
});

test('shorter forecasts and null optional metrics remain honest; polar zero timestamps never become 1970', () => {
  const raw = fixture({ count: 7 });
  delete raw.daily.wind_gusts_10m_max; delete raw.daily.precipitation_probability_max;
  raw.daily.sunrise[0] = 0; raw.daily.sunset[0] = 0; raw.daily.daylight_duration[0] = 86400;
  raw.daily.weather_code[0] = 4;
  raw.daily.temperature_2m_min[6] = null; raw.daily.temperature_2m_max[6] = null;
  const data = normalizeDaily(raw, berlin, NOW);
  assert.equal(data.available_days, 6);
  assert.equal(data.days[0].gust_max_kmh, null); assert.equal(data.days[0].precipitation_probability_max_percent, null);
  assert.equal(data.days[0].sunrise, null); assert.equal(data.days[0].sunset, null);
  assert.equal(data.days[0].daylight_seconds, 86400); assert.equal(data.days[0].weather_code, null);
});

test('preserves provider daily labels while solar instants follow IANA DST', () => {
  const now = Date.parse('2026-10-24T10:00:00Z');
  const data = normalizeDaily(fixture({ now, offset: 7200 }), berlin, now);
  assert.deepEqual(data.days.slice(0, 3).map(d => d.date), ['2026-10-24', '2026-10-25', '2026-10-26']);
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: data.time_zone, hour: '2-digit', hourCycle: 'h23' });
  assert.equal(formatter.format(new Date(data.days[0].sunrise)), '07');
  assert.equal(formatter.format(new Date(data.days[1].sunrise)), '06');
  assert.equal(data.period_utc_offset_seconds, 7200);
});

test('rejects wrong locations, elevation, dates, units and inconsistent arrays', () => {
  const changes = [d => d.latitude = 0, d => d.longitude = -74, d => d.elevation = 999, d => d.timezone = 'Asia/Shanghai',
    d => d.daily_units.wind_speed_10m_max = 'mph', d => d.daily.temperature_2m_max.pop(), d => d.daily.time[1] += 3600,
    d => d.daily.precipitation_sum[0] = -1, d => d.daily.temperature_2m_min[0] = 20, d => d.daily.sunrise[0] = 99,
    d => d.daily.time = [], d => d.utc_offset_seconds = 99999, d => d.utc_offset_seconds = 0, d => d.error = true];
  for (const change of changes) { const d = fixture(); change(d); assert.throws(() => normalizeDaily(d, berlin, NOW)); }
  assert.throws(() => normalizeDaily(fixture({ now: NOW - 86400_000 }), berlin, NOW));
});

test('forecast HTTP cache expires at the next provider midnight and never changes retrieval time on cache hits', async () => {
  let now = Date.parse('2026-11-25T22:59:00Z'), calls = 0;
  const h = createExtendedWeatherHandlers({ locations, enabled: () => true, clock: () => now, fetchImpl: async () => { calls++; return Response.json(fixture({ now })); } });
  const first = await forecast(h); assert.equal(first.headers.get('Cache-Control'), 'public, max-age=60');
  const retrieved = (await first.json()).retrieved_at;
  now += 30_000; const second = await forecast(h);
  assert.equal(second.headers.get('Cache-Control'), 'public, max-age=30');
  assert.equal((await second.json()).retrieved_at, retrieved); assert.equal(calls, 1);
  now += 31_000;
  assert.equal((await (await forecast(h)).json()).days[0].date, '2026-11-26'); assert.equal(calls, 2);
});

test('provider throttling applies across query variants, exposes only safe errors and respects Retry-After', async () => {
  let now = NOW, calls = 0;
  const h = createExtendedWeatherHandlers({ enabled: () => true, clock: () => now, fetchImpl: async () => {
    calls++; return new Response('secret provider failure', { status: 429, headers: { 'Retry-After': '120' } });
  } });
  const first = await search(h);
  assert.equal(first.status, 503); assert.deepEqual(await first.json(), { error: 'unavailable' });
  assert.equal(first.headers.get('Cache-Control'), 'no-store'); assert.equal(first.headers.get('Retry-After'), '120');
  now += 60_000;
  assert.equal((await search(h)).headers.get('Retry-After'), '60');
  assert.equal((await search(h, 'q=Paris')).headers.get('Retry-After'), '60'); assert.equal(calls, 1);
  now += 61_000; await search(h, 'q=Paris'); assert.equal(calls, 2);
});

test('concurrent cold requests and per-minute upstream budget are bounded, while cached reads remain available', async () => {
  let now = NOW, calls = 0, resolve;
  const wait = new Promise(done => { resolve = done; });
  const h = createExtendedWeatherHandlers({ enabled: () => true, clock: () => now, clientOptions: { maxConcurrent: 1, maxRequestsPerMinute: 1 }, fetchImpl: async () => { calls++; await wait; return Response.json({ results: [city] }); } });
  const first = search(h); await Promise.resolve();
  assert.equal((await search(h, 'q=Paris')).status, 429);
  resolve(); assert.equal((await first).status, 200);
  assert.equal((await search(h)).status, 200);
  assert.equal((await search(h, 'q=London')).status, 429); assert.equal(calls, 1);
  now += 60_001; assert.equal((await search(h, 'q=London')).status, 200); assert.equal(calls, 2);
});

test('wrong city ID, non-city IDs and not-found cities never trigger a forecast request', async () => {
  for (const response of [Response.json({ ...city, id: 7 }), Response.json({ ...city, feature_code: 'MT' }), new Response('not found', { status: 404 }), Response.json({ error: true, reason: 'Location ID not found.' }, { status: 400 })]) {
    let calls = 0;
    const h = createExtendedWeatherHandlers({ enabled: () => true, clock: () => NOW, fetchImpl: async url => { calls++; assert.equal(url.origin + url.pathname, GEOCODING_CITY); return response; } });
    const r = await forecast(h, 'city=2950159');
    assert.ok([404, 503].includes(r.status)); assert.equal(calls, 1);
  }
});

test('daily upstream budget survives minute boundaries but still serves cached queries', async () => {
  const s = harness({ clientOptions: { maxRequestsPerDay: 1 } });
  assert.equal((await search(s.handlers)).status, 200);
  s.now += 60_000;
  assert.equal((await search(s.handlers, 'q=Paris')).status, 429);
  assert.equal((await search(s.handlers)).status, 200);
  assert.equal(s.calls.length, 1);
  s.now += 24 * 3600_000;
  assert.equal((await search(s.handlers, 'q=Paris')).status, 200);
  assert.equal(s.calls.length, 2);
});

test('invalid upstream city/query does not disable other geocoding requests', async () => {
  let calls = 0;
  const h = createExtendedWeatherHandlers({ enabled: () => true, fetchImpl: async url => {
    calls++;
    if (url.pathname.endsWith('/get') || url.searchParams.get('name') === 'Invalid') return Response.json({ error: true }, { status: 400 });
    return Response.json({ results: [city] });
  } });
  assert.equal((await forecast(h, 'city=2147483647')).status, 404);
  assert.equal((await search(h, 'q=Invalid')).status, 400);
  assert.equal((await search(h)).status, 200);
  assert.equal(calls, 3);
});

test('malformed JSON, HTML, oversized and invalid UTF-8 responses fail closed', async () => {
  for (const response of [Response.json({ results: 'bad' }), new Response('<html>private</html>'), new Response('x'.repeat(1_000_001), { headers: { 'Content-Type': 'application/json' } }),
    new Response('{}', { headers: { 'Content-Type': 'application/json', 'Content-Length': '2000000' } }), new Response(Uint8Array.from([0xff]), { headers: { 'Content-Type': 'application/json' } })]) {
    const h = createExtendedWeatherHandlers({ enabled: () => true, fetchImpl: async () => response });
    const r = await search(h); assert.equal(r.status, 503); assert.deepEqual(await r.json(), { error: 'unavailable' });
  }
});

test('synchronous fetch failure does not poison the pending-request map permanently', async () => {
  let now = NOW, calls = 0;
  const load = createForecastClient({ clock: () => now, fetchImpl: () => { if (++calls === 1) throw new Error('private network detail'); return Response.json({ results: [city] }); } });
  const url = new URL(GEOCODING_SEARCH);
  await assert.rejects(load(url, normalizeCities, 1000));
  now += 61_000;
  assert.equal((await load(url, normalizeCities, 1000)).value[0].id, city.id); assert.equal(calls, 2);
});

test('turning off the feature prevents new requests even with a warm process cache', async () => {
  let enabled = true;
  const s = harness({ enabled: () => enabled });
  assert.equal((await search(s.handlers)).status, 200);
  enabled = false;
  assert.equal((await search(s.handlers)).status, 503); assert.equal(s.calls.length, 1);
});

test('deployed function entrypoints use the existing flag and expose no upstream request when disabled', async () => {
  const previous = process.env.PEAKGUIDE_WEATHER_ENABLED;
  process.env.PEAKGUIDE_WEATHER_ENABLED = 'false';
  try {
    const [searchModule, forecastModule] = await Promise.all([import('../weather-search.mjs'), import('../weather-forecast.mjs')]);
    for (const [handler, req] of [[searchModule.default, request('search', 'q=Warszawa')], [forecastModule.default, request('forecast', 'peak=sniezka')]]) {
      const response = await handler(req);
      assert.equal(response.status, 503);
      assert.deepEqual(await response.json(), { error: 'not_configured' });
    }
  } finally {
    if (previous === undefined) delete process.env.PEAKGUIDE_WEATHER_ENABLED;
    else process.env.PEAKGUIDE_WEATHER_ENABLED = previous;
  }
});
