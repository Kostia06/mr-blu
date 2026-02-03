import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface NotificationPreferences {
	emailOnInvoiceSent: boolean;
	emailOnInvoicePaid: boolean;
	emailOnEstimateSent: boolean;
	emailWeeklySummary: boolean;
}

const defaultPreferences: NotificationPreferences = {
	emailOnInvoiceSent: true,
	emailOnInvoicePaid: true,
	emailOnEstimateSent: true,
	emailWeeklySummary: false
};

export const GET: RequestHandler = async ({ locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Get notification preferences from user metadata
		const {
			data: { user },
			error
		} = await locals.supabase.auth.getUser();

		if (error || !user) {
			return json({ error: 'Failed to get user' }, { status: 400 });
		}

		const preferences = user.user_metadata?.notification_preferences || defaultPreferences;

		return json({
			success: true,
			preferences: { ...defaultPreferences, ...preferences }
		});
	} catch (error) {
		console.error('Get notifications error:', error);
		return json({ error: 'Failed to get notification preferences' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { preferences } = await request.json();

		// Validate preferences
		const validKeys = Object.keys(defaultPreferences);
		const sanitizedPreferences: Partial<NotificationPreferences> = {};

		for (const key of validKeys) {
			if (key in preferences && typeof preferences[key] === 'boolean') {
				sanitizedPreferences[key as keyof NotificationPreferences] = preferences[key];
			}
		}

		// Get current preferences
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();
		const currentPrefs = user?.user_metadata?.notification_preferences || defaultPreferences;

		// Merge with new preferences
		const newPreferences = { ...currentPrefs, ...sanitizedPreferences };

		// Update user metadata
		const { error: updateError } = await locals.supabase.auth.updateUser({
			data: {
				notification_preferences: newPreferences
			}
		});

		if (updateError) {
			console.error('Notification preferences update error:', updateError);
			return json({ error: updateError.message }, { status: 400 });
		}

		return json({
			success: true,
			preferences: newPreferences
		});
	} catch (error) {
		console.error('Notification preferences update error:', error);
		return json({ error: 'Failed to update notification preferences' }, { status: 500 });
	}
};
