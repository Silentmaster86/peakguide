import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as authApi from '../api/auth';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [recovery, setRecovery] = useState(false);
  const revision = useRef(0);

  const refresh = useCallback(async () => {
    const request = ++revision.current;
    try {
      const current = await authApi.me();
      if (request !== revision.current) return;
      setUser(current);
      setStatus(current ? 'authed' : 'guest');
      setError(null);
    } catch (failure) {
      if (request !== revision.current) return;
      setUser(null);
      setStatus('error');
      setError(failure);
    }
  }, []);

  useEffect(() => {
    const requestRevision = revision;
    const unsubscribe = authApi.subscribeAuth((event) => {
      if (event === 'SIGNED_OUT') {
        revision.current++;
        setUser(null);
        setStatus('guest');
        setRecovery(false);
        setError(null);
        return;
      }
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      void refresh();
    });
    // State is updated only after asynchronous session verification.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    return () => {
      requestRevision.current++;
      unsubscribe();
    };
  }, [refresh]);

  const authenticate = useCallback(async (operation, payload) => {
    const request = ++revision.current;
    setError(null);
    setStatus('loading');
    try {
      const result = await operation(payload);
      if (request === revision.current) {
        const authenticated = Boolean(result.session && result.user);
        setUser(authenticated ? result.user : null);
        setStatus(authenticated ? 'authed' : 'guest');
      }
      return result;
    } catch (failure) {
      if (request === revision.current) {
        setUser(null);
        setStatus('guest');
        setError(failure);
      }
      throw failure;
    }
  }, []);

  const login = useCallback(async (payload) => {
    const result = await authenticate(authApi.login, payload);
    return result.user;
  }, [authenticate]);
  const register = useCallback((payload) => authenticate(authApi.register, payload), [authenticate]);

  const logout = useCallback(async () => {
    revision.current++;
    setError(null);
    try {
      await authApi.logout();
      revision.current++;
      setUser(null);
      setRecovery(false);
      setStatus('guest');
      return true;
    } catch (failure) {
      setError(failure);
      return false;
    }
  }, []);

  const finishRecovery = useCallback(() => setRecovery(false), []);
  const value = useMemo(() => ({
    status, user, error, recovery, refresh, login, register, logout, finishRecovery,
  }), [status, user, error, recovery, refresh, login, register, logout, finishRecovery]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
