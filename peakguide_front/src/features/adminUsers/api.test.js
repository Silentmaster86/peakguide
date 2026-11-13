import { beforeEach, expect, it, vi } from 'vitest';
const { invoke } = vi.hoisted(() => ({ invoke: vi.fn() }));
vi.mock('../../lib/supabaseClient', () => ({ supabase: { functions: { invoke } } }));
import { adminDeleteUser } from './api';
const id = 'bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';
beforeEach(() => vi.resetAllMocks());
it('requires explicit confirmation of the requested account deletion', async () => {
  invoke.mockResolvedValue({ data: { ok: true, userId: id } });
  await expect(adminDeleteUser(id)).resolves.toEqual({ ok: true });
  expect(invoke).toHaveBeenCalledWith('admin-delete-user', { body: { userId: id } });
});
it.each([null, {}, { ok: true }, { ok: true, userId: 'different-account' }])('does not report success for an unconfirmed response %j', async (data) => {
  invoke.mockResolvedValue({ data });
  await expect(adminDeleteUser(id)).rejects.toThrow('not confirmed');
});
it('explains self-deletion refusal returned in an HTTP error body', async () => {
  invoke.mockResolvedValue({ error: { context: { json: async () => ({ error: 'SELF_DELETE_FORBIDDEN' }) } } });
  await expect(adminDeleteUser(id)).rejects.toThrow('own account');
});
it('handles missing deployment or non-JSON errors without claiming success', async () => {
  invoke.mockResolvedValue({ error: { context: { json: async () => { throw new Error('invalid json'); } } } });
  await expect(adminDeleteUser(id)).rejects.toThrow('Account deletion failed');
});
