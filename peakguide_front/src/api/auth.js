import { apiGet, apiPost } from "./client";

export function me() {
	return apiGet("/auth/me");
}

export function login({ email, password }) {
	return apiPost("/auth/login", { email, password });
}

export function register({ email, password, firstName, lastName }) {
	return apiPost("/auth/register", {
		email,
		password,
		firstName,
		lastName,
	});
}

export function logout() {
	return apiPost("/api/auth/logout");
}
