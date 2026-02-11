import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";

export function adminFetchPeaks({ lang = "pl", q = "" }) {
	const qs = new URLSearchParams();
	qs.set("lang", lang);
	if (q) qs.set("q", q);
	return apiGet(`/api/admin/peaks?${qs.toString()}`);
}

export function adminCreatePeak(body) {
	return apiPost("/api/admin/peaks", body);
}

export function adminUpdatePeak(id, body) {
	return apiPut(`/api/admin/peaks/${id}`, body);
}

export function adminDeletePeak(id) {
	return apiDelete(`/api/admin/peaks/${id}`);
}
