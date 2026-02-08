import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import * as authApi from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [status, setStatus] = useState("loading");
	const [user, setUser] = useState(null);
	const [error, setError] = useState(null);

	const refresh = useCallback(async () => {
		setError(null);
		setStatus("loading");
		try {
			const data = await authApi.me();
			// zakładam, że backend zwraca { user: {...} } albo sam user
			const u = data?.user ?? data ?? null;
			if (u) {
				setUser(u);
				setStatus("authed");
			} else {
				setUser(null);
				setStatus("guest");
			}
		} catch (e) {
			// 401 = brak sesji -> guest (to normalne)
			if (e?.status === 401) {
				setUser(null);
				setStatus("guest");
				return;
			}
			setUser(null);
			setStatus("error");
			setError(e?.message || "Auth error");
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const login = useCallback(async ({ email, password }) => {
		setError(null);
		setStatus("loading");
		try {
			const data = await authApi.login({ email, password });
			const u = data?.user ?? data ?? null;
			setUser(u);
			setStatus("authed");
			return u;
		} catch (e) {
			setUser(null);
			setStatus("guest");
			setError(e?.message || "Login failed");
			throw e;
		}
	}, []);

	const register = useCallback(async (payload) => {
		setError(null);
		setStatus("loading");
		try {
			const data = await authApi.register(payload);
			const u = data?.user ?? data ?? null;
			setUser(u);
			setStatus("authed");
			return u;
		} catch (e) {
			setUser(null);
			setStatus("guest");
			setError(e?.message || "Register failed");
			throw e;
		}
	}, []);

	const logout = useCallback(async () => {
		setError(null);
		setStatus("loading");
		try {
			await authApi.logout();
		} finally {
			// niezależnie czy logout endpoint padł, czyści stan
			setUser(null);
			setStatus("guest");
		}
	}, []);

	const value = useMemo(
		() => ({ status, user, error, refresh, login, register, logout }),
		[status, user, error, refresh, login, register, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
