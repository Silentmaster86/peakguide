export const API_URL = import.meta.env.VITE_API_URL;

async function parseError(res) {
	// backend can return JSON or text
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
	const res = await fetch(`${API_URL}${path}`, {
		credentials: "include", // important: cookie session
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

	// if 204 No Content
	if (res.status === 204) return null;

	const ct = res.headers.get("content-type") || "";
	if (ct.includes("application/json")) return res.json();
	return res.text();
}

export function apiGet(path) {
	return apiRequest(path, { method: "GET" });
}

export function apiPost(path, body) {
	return apiRequest(path, { method: "POST", body: JSON.stringify(body || {}) });
}
