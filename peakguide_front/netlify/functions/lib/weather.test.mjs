import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWeatherHandler, normalizeForecast, PROVIDER } from './weather.mjs';
const now = Date.parse('2026-11-22T10:15:00Z');
const MINUTE = 60_000;
const locations = { rysy: { latitude: 49.179531, longitude: 20.088138, elevation_m: 2499 } };
function fixture() { return {
  geometry: { type: 'Point', coordinates: [20.0881, 49.1795, 2499] },
  properties: { meta: { updated_at: '2026-11-22T09:00:00Z', units: { air_temperature: 'celsius', wind_speed: 'm/s', wind_speed_of_gust: 'm/s', precipitation_amount: 'mm' } },
    timeseries: ['10', '11', '12'].map(hour => ({ time: `2026-11-22T${hour}:00:00Z`, data: { instant: { details: { air_temperature: -5, wind_speed: 10, wind_speed_of_gust: 15 } }, next_1_hours: { details: { precipitation_amount: 0 } } } })) }
}; }
function upstream() { return Response.json(fixture(), { headers: { Expires: 'Sun, 22 Nov 2026 10:30:00 GMT', 'Last-Modified': 'Sun, 22 Nov 2026 09:00:00 GMT' } }); }
const request = (query = 'peak=rysy', method = 'GET') => new Request('https://peak-guide.netlify.app/.netlify/functions/peak-weather?' + query, { method });
test('disabled/unknown/malformed/method requests never call provider', async () => {
  let calls = 0;
  const handler = createWeatherHandler({ locations, fetchImpl: async () => { calls++; return upstream(); } });
  for (const [query, method, status] of [['peak=rysy','GET',503],['peak=unknown','GET',404],['peak=__proto__','GET',404],['lat=49&lon=20','GET',400],['peak=rysy&peak=rysy','GET',400],['peak=rysy','POST',405]]) {
    assert.equal((await handler(request(query,method))).status, status);
  }
  assert.equal(calls,0);
});
test('deduplicates requests, rounds units and respects Expires before conditional 304', async () => {
  let time = now, calls = 0;
  const handler = createWeatherHandler({ locations, enabled: () => true, clock: () => time, fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url.origin + url.pathname, PROVIDER);
    assert.equal(url.searchParams.get('lat'), '49.1795');
    assert.equal(url.searchParams.get('altitude'), '2499');
    assert.match(options.headers['User-Agent'], /github.com\/Silentmaster86\/peakguide/);
    if (calls === 1) return upstream();
    assert.equal(options.headers['If-Modified-Since'], 'Sun, 22 Nov 2026 09:00:00 GMT');
    return new Response(null, {status:304, headers:{ Expires: 'Sun, 22 Nov 2026 11:00:00 GMT' }});
  } });
  const responses = await Promise.all([handler(request()),handler(request())]);
  assert.equal(calls,1);
  const payload = await responses[0].json();
  assert.equal(payload.forecast[0].wind_kmh,36);
  assert.equal(payload.forecast[0].gust_kmh,54);
  assert.equal(payload.forecast[0].precipitation_mm_next_hour,0);
  assert.equal(responses[0].headers.get('Cache-Control'),'public, max-age=900');
  time += 14 * MINUTE;
  await handler(request()); assert.equal(calls,1);
  time += 2 * MINUTE;
  assert.equal((await handler(request())).status,200); assert.equal(calls,2);
});
test('six-hour rain is not misrepresented as hourly rain, missing gusts are null', () => {
  const data = fixture();
  const step = data.properties.timeseries[0];
  delete step.data.next_1_hours;
  step.data.next_6_hours = { details: { precipitation_amount: 9 } };
  delete step.data.instant.details.wind_speed_of_gust;
  const row = normalizeForecast(data, now).forecast[0];
  assert.equal(row.precipitation_mm_next_hour,null);
  assert.equal(row.gust_kmh,null);
});
test('rejects stale/malformed models and changed units', () => {
  for (const change of [d => d.properties.meta.updated_at = '2026-11-19T00:00:00Z', d => d.properties.meta.units.wind_speed = 'mph', d => d.geometry.coordinates = [999,50]]) {
    const data = fixture(); change(data);
    assert.throws(() => normalizeForecast(data,now));
  }
});
test('provider failure is cached, errors are sanitized, Retry-After respected', async () => {
  let calls = 0, time = now;
  const handler = createWeatherHandler({locations,enabled:()=>true,clock:()=>time,fetchImpl:async()=>{ calls++; return new Response('private provider failure',{status:429,headers:{'Retry-After':'120'}}); }});
  const response = await handler(request());
  assert.equal(response.status,503);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.deepEqual(await response.json(),{error:'unavailable'});
  time += MINUTE; await handler(request()); assert.equal(calls,1);
  time += 2 * MINUTE; await handler(request()); assert.equal(calls,2);
});
