import { beforeEach, expect, it, vi } from 'vitest';
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('../lib/supabaseClient', () => ({ supabase: { from } }));
import { fetchPeaks, fetchPeakBySlug, fetchRangeBySlug, fetchPeakTrailsBySlug, fetchNearbyPeaksBySlug, invalidatePeakGuideCache } from './peakguide';

function query(result) {
  const builder = {};
  for (const method of ['select', 'eq', 'order', 'limit', 'maybeSingle']) builder[method] = vi.fn(() => builder);
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return builder;
}
const peak = { id: 1, slug: 'peak', active: true, peaks_i18n: [{ lang: 'pl', name: 'Szczyt' }], mountain_ranges: { slug: 'range' } };
beforeEach(() => { vi.resetAllMocks(); invalidatePeakGuideCache(); });

it('uses the range slug and a nonempty translation when the requested language is missing', async () => {
  from.mockReturnValue(query({ data: [{ ...peak, peaks_i18n: [{ lang: 'en', name: ' ' }, ...peak.peaks_i18n] }] }));
  expect((await fetchPeaks({ lang: 'en' }))[0]).toMatchObject({ range_name: 'range', name: 'Szczyt', content_lang: 'pl' });
});
it('returns null for missing details and no child requests for a missing peak', async () => {
  from.mockReturnValue(query({ data: null }));
  expect(await fetchPeakBySlug('pl', 'missing')).toBeNull();
  expect(await fetchRangeBySlug('pl', 'missing')).toBeNull();
  expect(await fetchPeakTrailsBySlug('pl', 'missing')).toEqual([]);
  expect(from.mock.calls.every(([table]) => table !== 'trails')).toBe(true);
});
it('retains transport failures instead of treating them as not found', async () => {
  from.mockReturnValue(query({ error: new Error('offline') }));
  await expect(fetchPeakBySlug('pl', 'peak')).rejects.toThrow('offline');
});
it('an old request cannot repopulate an invalidated cache', async () => {
  let resolveOld;
  from.mockReturnValueOnce(query(new Promise((resolve) => { resolveOld = resolve; })));
  const old = fetchPeaks();
  invalidatePeakGuideCache();
  from.mockReturnValueOnce(query({ data: [{ ...peak, slug: 'updated' }] }));
  expect((await fetchPeaks())[0].slug).toBe('updated');
  resolveOld({ data: [peak] });
  await old;
  expect((await fetchPeaks())[0].slug).toBe('updated');
  expect(from).toHaveBeenCalledTimes(2);
});
it('filters inactive nearby peaks in the server query before applying the limit', async () => {
  const nearby = query({ data: [{ peaks: peak }] });
  from.mockReturnValueOnce(query({ data: peak })).mockReturnValueOnce(nearby);
  expect((await fetchNearbyPeaksBySlug('pl', 'peak'))[0]).toMatchObject({ name: 'Szczyt', distance_km: null });
  expect(nearby.select.mock.calls[0][0]).toContain('!inner');
  expect(nearby.eq).toHaveBeenCalledWith('peaks.active', true);
  expect(nearby.eq.mock.invocationCallOrder.at(-1)).toBeLessThan(nearby.limit.mock.invocationCallOrder[0]);
});
it('uses the same translation fallback for trails on details pages', async () => {
  from.mockReturnValueOnce(query({ data: peak })).mockReturnValueOnce(query({ data: [{ slug: 'trail', trails_i18n: [{ lang: 'pl', name: 'Szlak' }] }] }));
  expect((await fetchPeakTrailsBySlug('zh', 'peak'))[0]).toMatchObject({ name: 'Szlak', content_lang: 'pl' });
});
