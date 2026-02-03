import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isValidEmail, isValidPhone, isValidUUID } from '$lib/server/security/validation';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized', success: false }, { status: 401 });
	}

	const userId = session.user.id;
	const supabase = locals.supabase;

	try {
		const { clientId, email, phone, name } = await request.json();

		if (!clientId || !isValidUUID(clientId)) {
			return json({ error: 'Valid client ID is required', success: false }, { status: 400 });
		}

		if (email !== undefined && email !== '' && !isValidEmail(email)) {
			return json({ error: 'Invalid email format', success: false }, { status: 400 });
		}

		if (phone !== undefined && phone !== '' && !isValidPhone(phone)) {
			return json({ error: 'Invalid phone format', success: false }, { status: 400 });
		}

		// Verify the client belongs to this user
		const { data: client, error: fetchError } = await supabase
			.from('clients')
			.select('id, user_id')
			.eq('id', clientId)
			.single();

		if (fetchError || !client) {
			return json({ error: 'Client not found', success: false }, { status: 404 });
		}

		if (client.user_id !== userId) {
			return json({ error: 'Unauthorized', success: false }, { status: 403 });
		}

		// Build update object with only provided fields
		const updateData: Record<string, string> = {};
		if (email !== undefined) {
			updateData.email = email;
		}
		if (phone !== undefined) {
			updateData.phone = phone;
		}
		if (name !== undefined && typeof name === 'string') {
			updateData.name = name.trim();
		}

		if (Object.keys(updateData).length === 0) {
			return json({ error: 'No data to update', success: false }, { status: 400 });
		}

		// Update the client
		const { error: updateError } = await supabase
			.from('clients')
			.update(updateData)
			.eq('id', clientId);

		if (updateError) {
			console.error('Client update error:', updateError);
			return json({ error: 'Failed to update client', success: false }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Client update error:', error);
		return json({ error: 'Server error', success: false }, { status: 500 });
	}
};
