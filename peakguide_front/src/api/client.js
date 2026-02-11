export const API_URL = import.meta.env.VITE_API_URL || "";

// base = https://.../api  (albo "" w dev jeśli nie ustawisz VITE_API_URL)
const origin = API_URL ? API_URL.replace(/\/$/, "") : "";
const base = origin ? `${origin}/api` : "/api";

async function parseError(res) {
	const ct = res.headers.get("content-type") || "";
	if (ct.includes("application/json")) {
		const data = await res.json().catch(() => null);
		return (
			data?.error || data?.message || JSON.stringify(data) || "Request failed"
		);
	}
	const text = await res.text().catch(() => "");
	return text || `Request failed (${res.status})`;
}

export async function apiRequest(path, options = {}) {
	const res = await fetch(`${base}${path}`, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(options.headers || {}),
		},
		...options,
	});

	if (!res.ok) {
		const msg = await parseError(res);
		const err = new Error(msg);
		err.status = res.status;
		throw err;
	}

	if (res.status === 204) return null;

	const ct = res.headers.get("content-type") || "";
	if (ct.includes("application/json")) return res.json();
	return res.text();
}

export const apiGet = (p) => apiRequest(p, { method: "GET" });
export const apiPost = (p, b) =>
	apiRequest(p, { method: "POST", body: JSON.stringify(b || {}) });
export const apiPut = (p, b) =>
	apiRequest(p, { method: "PUT", body: JSON.stringify(b || {}) });
export const apiDelete = (p) => apiRequest(p, { method: "DELETE" });
