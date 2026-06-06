export async function apiRequest() {
	throw new Error(
		'Legacy API client is disabled. Use Supabase client instead.',
	);
}

export function apiGet() {
	return apiRequest();
}

export function apiPost() {
	return apiRequest();
}

export function apiPut() {
	return apiRequest();
}

export function apiDelete() {
	return apiRequest();
}

export function apiPatch() {
	return apiRequest();
}
