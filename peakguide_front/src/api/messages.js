import { supabase } from '../lib/supabaseClient';

function normalizeEmail(email) {
	return String(email || '')
		.trim()
		.toLowerCase();
}

export async function sendMessage({ email, message }) {
	const cleanEmail = normalizeEmail(email);
	const cleanMessage = String(message || '').trim();

	if (!cleanEmail || !cleanEmail.includes('@')) {
		throw new Error('Invalid email');
	}

	if (!cleanMessage || cleanMessage.length < 5) {
		throw new Error('Message too short');
	}

	const { data, error } = await supabase
		.from('contact_messages')
		.insert({
			email: cleanEmail,
			message: cleanMessage,
			status: 'new',
		})
		.select('id, email, message, created_at, status')
		.single();

	if (error) throw new Error(error.message);

	return { item: data };
}

export async function adminFetchMessages() {
	const { data, error } = await supabase
		.from('contact_messages')
		.select('id, email, message, created_at, status')
		.order('created_at', { ascending: false })
		.limit(200);

	if (error) throw new Error(error.message);

	return { items: data || [] };
}

export async function adminSetMessageStatus(id, status) {
	if (!['new', 'archived'].includes(status)) {
		throw new Error('Invalid status');
	}

	const { data, error } = await supabase
		.from('contact_messages')
		.update({ status })
		.eq('id', id)
		.select('id, status')
		.single();

	if (error) throw new Error(error.message);

	return data;
}

export async function adminDeleteMessage(id) {
	const { error } = await supabase
		.from('contact_messages')
		.delete()
		.eq('id', id);

	if (error) throw new Error(error.message);

	return { ok: true };
}
