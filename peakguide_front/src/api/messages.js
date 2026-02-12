import { apiGet, apiPost, apiPatch, apiDelete } from "./client";

export function sendMessage({ email, message }) {
	return apiPost("/api/messages", { email, message });
}

export function adminFetchMessages() {
	return apiGet("/api/admin/messages");
}

export function adminSetMessageStatus(id, status) {
	return apiPatch(`/api/admin/messages/${id}/status`, { status });
}

export function adminDeleteMessage(id) {
	return apiDelete(`/api/admin/messages/${id}`);
}
