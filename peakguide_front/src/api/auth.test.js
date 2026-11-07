import { beforeEach, describe, expect, it, vi } from 'vitest';
const { auth, from, profile, unsubscribe } = vi.hoisted(() => ({
  auth: { signUp: vi.fn(), signInWithPassword: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), onAuthStateChange: vi.fn(), resetPasswordForEmail: vi.fn(), updateUser: vi.fn() },
  from: vi.fn(), profile: vi.fn(), unsubscribe: vi.fn(),
}));
vi.mock('../lib/supabaseClient', () => ({ supabase: { auth, from } }));
import { register, login, me, logout, subscribeAuth, requestPasswordReset, updatePassword } from './auth';

beforeEach(() => {
  vi.resetAllMocks();
  from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: profile }) }) });
  profile.mockResolvedValue({ data: { display_name: 'Test', is_admin: false }, error: null });
});

describe('account API', () => {
  it('does not query protected profiles before email confirmation', async () => {
    auth.signUp.mockResolvedValue({ data: { user: { id: 'new' }, session: null }, error: null });
    expect(await register({ email: 'test@example.com', firstName: '明', password: 'secret' })).toEqual({ user: null, session: null, requiresConfirmation: true });
    expect(from).not.toHaveBeenCalled();
  });
  it('maps a profile only after receiving an authenticated session', async () => {
    auth.signInWithPassword.mockResolvedValue({ data: { user: { id: 'one', email: 'test@example.com' }, session: { access_token: 'test' } } });
    expect((await login({})).user).toMatchObject({ id: 'one', displayName: 'Test', is_admin: false });
    expect(from).toHaveBeenCalledWith('profiles');
  });
  it('does not disguise profile permission failures as successful login', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'one' } } });
    profile.mockResolvedValue({ error: new Error('denied') });
    await expect(me()).rejects.toMatchObject({ code: 'profile_unavailable' });
  });
  it('treats missing sessions as guests and propagates sign-out failures', async () => {
    auth.getUser.mockResolvedValue({ error: { name: 'AuthSessionMissingError' } });
    expect(await me()).toBeNull();
    auth.signOut.mockResolvedValue({ error: new Error('offline') });
    await expect(logout()).rejects.toThrow('offline');
  });
  it('defers auth callbacks outside the SDK lock and cancels pending callbacks on unsubscribe', async () => {
    vi.useFakeTimers();
    let callback;
    auth.onAuthStateChange.mockImplementation((fn) => { callback = fn; return { data: { subscription: { unsubscribe } } }; });
    const listener = vi.fn();
    const stop = subscribeAuth(listener);
    callback('SIGNED_IN');
    expect(listener).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(listener).toHaveBeenCalledWith('SIGNED_IN');
    callback('SIGNED_OUT');
    stop();
    await vi.runAllTimersAsync();
    expect(listener).toHaveBeenCalledTimes(1);
    expect(unsubscribe).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
  it('uses the local recovery route and propagates password update errors', async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    await requestPasswordReset(' test@example.com ');
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com', { redirectTo: `${window.location.origin}/reset-password` });
    auth.updateUser.mockResolvedValue({ error: new Error('expired') });
    await expect(updatePassword('secret')).rejects.toThrow('expired');
  });
});
