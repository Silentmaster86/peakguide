import { supabase } from '../../lib/supabaseClient';

export async function adminFetchUsers() {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, email, display_name, role, is_admin, created_at')
		.order('created_at', { ascending: false });

	if (error) throw new Error(error.message);

	return {
		items: (data || []).map((u) => ({
			...u,
			active: true,
		})),
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
		.select('id, is_admin, role');

	if (error) throw new Error(error.message);

	return Array.isArray(data) ? data[0] : data;
}

export async function adminDeleteUser(id) {
	const { data, error } = await supabase.functions.invoke('admin-delete-user', {
		body: { userId: id },
	});

	if (error) throw new Error(error.message);
	if (data?.error) throw new Error(data.error);

	return { ok: true };
}
