import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { business } = await request.json();

		// Update user metadata with business info
		const { error: updateError } = await locals.supabase.auth.updateUser({
			data: {
				business: {
					name: business.name || null,
					address: business.address || null,
					city: business.city || null,
					state: business.state || null,
					zip: business.zip || null,
					tax_id: business.tax_id || null,
					website: business.website || null
				}
			}
		});

		if (updateError) {
			console.error('Business update error:', updateError);
			return json({ error: updateError.message }, { status: 400 });
		}

		// Compose full address for templates
		const fullAddress = [business.address, business.city, business.state, business.zip]
			.filter(Boolean)
			.join(', ');

		// Also update the profiles table if it exists
		const { error: profileError } = await locals.supabase.from('profiles').upsert(
			{
				id: session.user.id,
				business_name: business.name || null,
				business_address: business.address || null,
				address: fullAddress || null,
				website: business.website || null,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'id' }
		);

		if (profileError) {
			console.error('Profile table update error:', profileError);
			// Don't fail - auth update succeeded
		}

		return json({ success: true });
	} catch (error) {
		console.error('Business update error:', error);
		return json({ error: 'Failed to update business info' }, { status: 500 });
	}
};
