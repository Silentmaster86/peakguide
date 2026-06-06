import { supabase } from '../lib/supabaseClient';

async function getProfile(userId) {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, email, display_name, role, is_admin')
		.eq('id', userId)
		.single();

	if (error) return null;
	return data;
}

async function mapUser(user) {
	if (!user) return null;

	const profile = await getProfile(user.id);

	return {
		id: user.id,
		email: user.email,
		displayName:
			profile?.display_name || user.user_metadata?.display_name || user.email,
		role: profile?.role || 'user',
		is_admin: profile?.is_admin === true,
	};
}

export async function me() {
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) return null;

	return await mapUser(data.user);
}

export async function login({ email, password }) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw new Error(error.message);

	return {
		user: await mapUser(data.user),
		session: data.session,
	};
}

export async function register({ email, password, firstName, lastName }) {
	const displayName = `${firstName || ''} ${lastName || ''}`.trim();

	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				first_name: firstName || '',
				last_name: lastName || '',
				display_name: displayName || email,
			},
		},
	});

	if (error) throw new Error(error.message);

	return {
		user: await mapUser(data.user),
		session: data.session,
	};
}

export async function logout() {
	const { error } = await supabase.auth.signOut();

	if (error) {
		console.warn('Supabase logout warning:', error.message);
	}

	return { ok: true };
}
