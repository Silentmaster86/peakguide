import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import * as api from '../api/auth';
vi.mock('../api/auth', () => ({ me: vi.fn(), login: vi.fn(), register: vi.fn(), logout: vi.fn(), subscribeAuth: vi.fn() }));
let listener;
const unsubscribe = vi.fn();
const person = { id: 'one', displayName: 'Test' };
beforeEach(() => {
  vi.resetAllMocks();
  api.me.mockResolvedValue(null);
  api.subscribeAuth.mockImplementation((fn) => { listener = fn; return unsubscribe; });
});
it('keeps confirmation-required signups in guest state', async () => {
  const { result } = renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.status).toBe('guest'));
  api.register.mockResolvedValue({ user: null, session: null, requiresConfirmation: true });
  await act(() => result.current.register({}));
  expect(result.current.status).toBe('guest');
  expect(result.current.user).toBeNull();
});
it('cannot resurrect a signed-out account from an older verification response', async () => {
  let resolve;
  api.me.mockReturnValue(new Promise((done) => { resolve = done; }));
  const { result, unmount } = renderHook(useAuth, { wrapper: AuthProvider });
  act(() => listener('SIGNED_OUT'));
  await act(async () => resolve(person));
  expect(result.current.status).toBe('guest');
  expect(result.current.user).toBeNull();
  unmount();
  expect(unsubscribe).toHaveBeenCalledOnce();
});
it('updates the account on SDK events and handles failed logout without dropping the account', async () => {
  const { result } = renderHook(useAuth, { wrapper: AuthProvider });
  await waitFor(() => expect(result.current.status).toBe('guest'));
  api.me.mockResolvedValue(person);
  await act(async () => listener('PASSWORD_RECOVERY'));
  expect(result.current.user).toEqual(person);
  expect(result.current.recovery).toBe(true);
  api.logout.mockRejectedValue(new Error('offline'));
  let success;
  await act(async () => { success = await result.current.logout(); });
  expect(success).toBe(false);
  expect(result.current.status).toBe('authed');
  expect(result.current.error.message).toBe('offline');
});
