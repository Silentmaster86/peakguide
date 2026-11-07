import { supabase } from '../lib/supabaseClient';

async function getProfile(userId) {
	const { data, error } = await supabase
		.from('profiles')
		.select('id, email, display_name, role, is_admin')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		const failure = new Error('Could not load user profile', { cause: error });
		failure.code = 'profile_unavailable';
		throw failure;
	}
	return data;
}

function isMissingSessionError(error) {
	return (
		error?.name === 'AuthSessionMissingError' ||
		String(error?.message || '').toLowerCase().includes('auth session missing')
	);
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

	if (error) {
		if (isMissingSessionError(error)) return null;
		throw new Error(`Could not verify the current session: ${error.message}`);
	}

	if (!data?.user) return null;

	return await mapUser(data.user);
}

export async function login({ email, password }) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) throw error;
	if (!data?.session || !data?.user) throw new Error('Missing authenticated session');

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

	if (error) throw error;

	return {
		// Confirmation-required signups cannot read protected profiles yet.
		user: data.session ? await mapUser(data.user) : null,
		session: data.session,
		requiresConfirmation: !data.session,
	};
}

export async function logout() {
	const { error } = await supabase.auth.signOut({ scope: 'local' });
	if (error) throw error;
	return { ok: true };
}

export function subscribeAuth(listener) {
	const timers = new Set();
	const { data } = supabase.auth.onAuthStateChange((event) => {
		// Leave the SDK's auth lock before calling getUser/getProfile.
		const timer = setTimeout(() => {
			timers.delete(timer);
			listener(event);
		}, 0);
		timers.add(timer);
	});
	return () => {
		data.subscription.unsubscribe();
		for (const timer of timers) clearTimeout(timer);
	};
}

export async function requestPasswordReset(email) {
	const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
		redirectTo: new URL('/reset-password', window.location.origin).href,
	});
	if (error) throw error;
}

export async function updatePassword(password) {
	const { error } = await supabase.auth.updateUser({ password });
	if (error) throw error;
}
