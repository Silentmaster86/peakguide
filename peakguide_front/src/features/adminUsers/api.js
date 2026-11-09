import { supabase } from '../../lib/supabaseClient';

export async function adminFetchUsers() {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, email, display_name, role, is_admin, created_at')
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);

	return {
		items: data || [],
	};
}

export async function adminToggleAdmin(id) {
	const { data: current, error: fetchError } = await supabase
		.from('profiles')
		.select('id, is_admin')
		.eq('id', id)
		.maybeSingle();

	if (fetchError) throw new Error(fetchError.message);
	if (!current) throw new Error('User profile not found');

	const nextIsAdmin = !current.is_admin;

	const { data, error } = await supabase
		.from('profiles')
		.update({
			is_admin: nextIsAdmin,
			role: nextIsAdmin ? 'admin' : 'user',
		})
		.eq('id', id)
		.eq('is_admin', current.is_admin)
		.select('id, is_admin, role');

	if (error) throw new Error(error.message);

	const updated = Array.isArray(data) ? data[0] : data;
	if (!updated) throw new Error('The user has changed. Refresh and try again.');
	return updated;
}

export async function adminDeleteUser(id) {
	const { data, error } = await supabase.functions.invoke('admin-delete-user', {
		body: { userId: id },
	});

	if (error || data?.error) {
		let code = data?.error;
		if (error?.context?.json) {
			try { code = (await error.context.json())?.error; } catch { /* Use a safe fallback. */ }
		}
		const messages = {
			AUTH_REQUIRED: 'Your session has expired. Sign in again.',
			ADMIN_REQUIRED: 'Administrator permissions are required.',
			SELF_DELETE_FORBIDDEN: 'You cannot delete your own account.',
			USER_NOT_FOUND: 'This account no longer exists. Refresh the list.',
			DELETE_FAILED: 'The account could not be deleted. Database protection or another dependency may be blocking it.',
		};
		throw new Error(messages[code] || 'Account deletion failed. Refresh the list before trying again.');
	}
	if (data?.ok !== true || data?.userId?.toLowerCase() !== String(id).toLowerCase()) {
		throw new Error('Account deletion was not confirmed. Refresh the list.');
	}

	return { ok: true };
}
