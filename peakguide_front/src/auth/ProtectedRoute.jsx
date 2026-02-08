import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute() {
	const { status } = useAuth();
	const location = useLocation();

	if (status === "loading")
		return <div style={{ padding: 16 }}>Loading session…</div>;
	if (status !== "authed") {
		return <Navigate to='/login' replace state={{ from: location }} />;
	}
	return <Outlet />;
}

export function AdminRoute() {
	const { status, user } = useAuth();
	const location = useLocation();

	if (status === "loading")
		return <div style={{ padding: 16 }}>Loading session…</div>;
	if (status !== "authed") {
		return <Navigate to='/login' replace state={{ from: location }} />;
	}
	if (!user?.is_admin) {
		return <Navigate to='/panel' replace />;
	}
	return <Outlet />;
}
