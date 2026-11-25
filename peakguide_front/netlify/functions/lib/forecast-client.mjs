export class ForecastError extends Error {
  constructor(status, code, retryAfter = 0) { super(code); this.status = status; this.code = code; this.retryAfter = retryAfter; }
}
const MINUTE = 60_000;
async function boundedJSON(response) {
  if (!/^application\/json\b/i.test(response.headers.get('Content-Type') || '') || Number(response.headers.get('Content-Length')) > 1_000_000) {
    await response.body?.cancel().catch(() => {});
    throw new Error('Invalid JSON response');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing body');
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let bytes = 0, text = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 1_000_000) { await reader.cancel(); throw new Error('Response too large'); }
      text += decoder.decode(value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
}

export function createForecastClient({ fetchImpl = fetch, clock = Date.now, maxEntries = 256, maxRequestsPerMinute = 20, maxRequestsPerDay = 2000, maxConcurrent = 4 } = {}) {
  const cache = new Map(), pending = new Map(), cooldowns = new Map();
  let requests = [], dailyRequests = [];
  function store(key, value) {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
  }
  return async function load(url, normalize, ttl, notFoundCode, badRequestCode) {
    const key = url.href, now = clock(), cached = cache.get(key);
    if (cached && cached.expires > now) {
      cache.delete(key); cache.set(key, cached);
      if (cached.error) throw new ForecastError(cached.error.status, cached.error.code, cached.error.retryAfter ? Math.ceil((cached.expires - now) / 1000) : 0);
      return cached;
    }
    cache.delete(key);
    if (pending.has(key)) return pending.get(key);
    const retry = cooldowns.get(url.origin) - now;
    if (retry > 0) throw new ForecastError(503, 'unavailable', Math.ceil(retry / 1000));
    requests = requests.filter(time => time > now - MINUTE);
    dailyRequests = dailyRequests.filter(time => time > now - 24 * 3600_000);
    if (dailyRequests.length >= maxRequestsPerDay) throw new ForecastError(429, 'busy', Math.max(1, Math.ceil((dailyRequests[0] + 24 * 3600_000 - now) / 1000)));
    if (requests.length >= maxRequestsPerMinute || pending.size >= maxConcurrent) throw new ForecastError(429, 'busy', 60);
    requests.push(now);
    dailyRequests.push(now);
    const work = Promise.resolve().then(async () => {
      try {
        const response = await fetchImpl(url, { headers: { Accept: 'application/json', 'User-Agent': 'PeakGuide/1.0 github.com/Silentmaster86/peakguide' }, redirect: 'error', signal: AbortSignal.timeout(8000) });
        if ([400, 404].includes(response.status) && notFoundCode) {
          await response.body?.cancel().catch(() => {});
          throw new ForecastError(404, notFoundCode);
        }
        if (response.status === 400 && badRequestCode) {
          await response.body?.cancel().catch(() => {});
          throw new ForecastError(400, badRequestCode);
        }
        if (response.status !== 200) {
          const raw = response.headers.get('Retry-After');
          const until = /^\d+$/.test(raw || '') ? clock() + Number(raw) * 1000 : Date.parse(raw);
          const delay = Math.min(86400, Math.max(60, Number.isFinite(until) ? Math.ceil((until - clock()) / 1000) : 60));
          cooldowns.set(url.origin, clock() + delay * 1000);
          await response.body?.cancel().catch(() => {});
          throw new ForecastError(503, 'unavailable', delay);
        }
        const value = normalize(await boundedJSON(response), clock());
        const lifetime = typeof ttl === 'function' ? ttl(value, clock()) : ttl;
        const result = { value, expires: clock() + lifetime };
        store(key, result);
        return result;
      } catch (cause) {
        const error = cause instanceof ForecastError ? cause : new ForecastError(503, 'unavailable', 60);
        store(key, { error, expires: clock() + (error.retryAfter || 60) * 1000 });
        throw error;
      } finally { pending.delete(key); }
    });
    pending.set(key, work);
    return work;
  };
}
