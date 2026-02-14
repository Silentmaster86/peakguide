import { apiGet, apiPatch, apiDelete } from "../../api/client";

export function adminFetchUsers() {
	return apiGet("/api/admin/users");
}

export function adminToggleAdmin(id) {
	return apiPatch(`/api/admin/users/${id}/admin`);
}

export function adminDeleteUser(id) {
	return apiDelete(`/api/admin/users/${id}`);
}
