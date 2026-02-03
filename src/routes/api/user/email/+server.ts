import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { newEmail } = await request.json();

		if (!newEmail || typeof newEmail !== 'string') {
			return json({ error: 'New email is required' }, { status: 400 });
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(newEmail)) {
			return json({ error: 'Invalid email format' }, { status: 400 });
		}

		// Check if email is same as current
		if (newEmail.toLowerCase() === session.user.email?.toLowerCase()) {
			return json({ error: 'New email must be different from current email' }, { status: 400 });
		}

		// Update email via Supabase Auth
		// This will send a confirmation email to the new address
		const { error: updateError } = await locals.supabase.auth.updateUser({
			email: newEmail
		});

		if (updateError) {
			console.error('Email update error:', updateError);

			// Handle specific errors
			if (updateError.message.includes('already registered')) {
				return json({ error: 'This email is already in use' }, { status: 400 });
			}

			return json({ error: updateError.message }, { status: 400 });
		}

		return json({
			success: true,
			message: 'Confirmation email sent. Please check your new email to confirm the change.'
		});
	} catch (error) {
		console.error('Email update error:', error);
		return json({ error: 'Failed to update email' }, { status: 500 });
	}
};
