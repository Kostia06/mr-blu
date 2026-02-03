import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// POST - Request password reset email
export const POST: RequestHandler = async ({ request, locals, url }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const userEmail = session.user.email;

		if (!userEmail) {
			return json({ error: 'No email associated with account' }, { status: 400 });
		}

		// Send password reset email
		const { error } = await locals.supabase.auth.resetPasswordForEmail(userEmail, {
			redirectTo: `${url.origin}/auth/callback?type=recovery`
		});

		if (error) {
			console.error('Password reset error:', error);
			return json({ error: error.message }, { status: 400 });
		}

		return json({
			success: true,
			message: 'Password reset email sent. Check your inbox.'
		});
	} catch (error) {
		console.error('Password reset error:', error);
		return json({ error: 'Failed to send password reset email' }, { status: 500 });
	}
};

// PATCH - Update password directly (when user has recovery token)
export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { newPassword } = await request.json();

		if (!newPassword || typeof newPassword !== 'string') {
			return json({ error: 'New password is required' }, { status: 400 });
		}

		if (newPassword.length < 8) {
			return json({ error: 'Password must be at least 8 characters' }, { status: 400 });
		}

		// Update password
		const { error } = await locals.supabase.auth.updateUser({
			password: newPassword
		});

		if (error) {
			console.error('Password update error:', error);
			return json({ error: error.message }, { status: 400 });
		}

		return json({
			success: true,
			message: 'Password updated successfully'
		});
	} catch (error) {
		console.error('Password update error:', error);
		return json({ error: 'Failed to update password' }, { status: 500 });
	}
};
