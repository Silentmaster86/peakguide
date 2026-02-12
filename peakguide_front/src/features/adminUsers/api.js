import { apiGet, apiPatch } from "../../api/client";

export function adminFetchUsers() {
	return apiGet("/api/admin/users");
}

export function adminToggleAdmin(id) {
	return apiPatch(`/api/admin/users/${id}/admin`);
}
