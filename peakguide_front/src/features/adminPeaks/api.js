import { apiGet, apiPost, apiPut, apiDelete } from "../../api/client";

export function adminFetchPeaks({ lang = "pl", q = "" }) {
	const qs = new URLSearchParams();
	qs.set("lang", lang);
	if (q) qs.set("q", q);
	return apiGet(`/admin/peaks?${qs.toString()}`);
}

export function adminCreatePeak(body) {
	return apiPost("/admin/peaks", body);
}

export function adminUpdatePeak(id, body) {
	return apiPut(`/admin/peaks/${id}`, body);
}

export function adminDeletePeak(id) {
	return apiDelete(`/admin/peaks/${id}`);
}
