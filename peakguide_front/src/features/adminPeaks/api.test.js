import { beforeEach, expect, it, vi } from 'vitest';
const { rpc, invalidatePeakGuideCache } = vi.hoisted(() => ({ rpc: vi.fn(), invalidatePeakGuideCache: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: { rpc } }));
vi.mock('../../api/peakguide', () => ({ invalidatePeakGuideCache }));
import { adminCreatePeak, adminUpdatePeak } from './api';
const body = { slug: 'test', range_id: 1, elevation_m: 1000, active: true, i18n: { pl: { name: 'Test' } } };
beforeEach(() => vi.resetAllMocks());
it('writes a peak and its translations with one RPC and invalidates only after success', async () => {
  rpc.mockResolvedValue({ data: 42 });
  expect(await adminCreatePeak(body)).toMatchObject({ item: { id: 42 } });
  expect(rpc).toHaveBeenCalledOnce();
  expect(rpc).toHaveBeenCalledWith('admin_save_peak', { p_peak_id: null, p_body: expect.objectContaining({ i18n: { pl: expect.objectContaining({ name: 'Test' }) } }) });
  expect(invalidatePeakGuideCache).toHaveBeenCalledOnce();
});
it('does not invalidate or attempt nontransactional fallback after an RPC failure', async () => {
  rpc.mockResolvedValue({ error: { message: 'translation rejected' } });
  await expect(adminUpdatePeak(42, body)).rejects.toThrow('translation rejected');
  expect(rpc).toHaveBeenCalledOnce();
  expect(invalidatePeakGuideCache).not.toHaveBeenCalled();
});
