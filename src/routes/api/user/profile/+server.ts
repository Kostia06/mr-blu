import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Fetch from profiles table
		const { data: profile, error } = await locals.supabase
			.from('profiles')
			.select('full_name, business_name, email, phone, address, website')
			.eq('id', session.user.id)
			.single();

		if (error && error.code !== 'PGRST116') {
			// PGRST116 = row not found
			console.error('Profile fetch error:', error);
			return json({ error: 'Failed to fetch profile' }, { status: 500 });
		}

		// Fallback to auth user data if profile not found
		const userData = session.user;
		const biz = userData.user_metadata?.business;
		return json({
			profile: {
				full_name: profile?.full_name || userData.user_metadata?.full_name || null,
				business_name: profile?.business_name || biz?.name || null,
				email: profile?.email || userData.email || null,
				phone: profile?.phone || userData.user_metadata?.phone || null,
				address: profile?.address || biz?.address || null,
				website: profile?.website || biz?.website || null
			}
		});
	} catch (error) {
		console.error('Profile fetch error:', error);
		return json({ error: 'Failed to fetch profile' }, { status: 500 });
	}
};

export const PATCH: RequestHandler = async ({ request, locals }) => {
	// Session already validated in auth guard hook
	const session = locals.session;
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { first_name, last_name, full_name, phone } = body;

		// Update user metadata in Supabase Auth
		const { error: updateError } = await locals.supabase.auth.updateUser({
			data: {
				first_name,
				last_name,
				full_name,
				phone
			}
		});

		if (updateError) {
			console.error('Profile update error:', updateError);
			return json({ error: updateError.message }, { status: 400 });
		}

		// Also update the profiles table if it exists
		const { error: profileError } = await locals.supabase.from('profiles').upsert(
			{
				id: session.user.id,
				full_name,
				phone,
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
		console.error('Profile update error:', error);
		return json({ error: 'Failed to update profile' }, { status: 500 });
	}
};
