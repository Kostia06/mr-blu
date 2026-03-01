import type { Env } from '../../types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
	const body = (await request.json()) as { email?: string };
	const email = body.email?.trim().toLowerCase();

	if (!email || !EMAIL_REGEX.test(email)) {
		return new Response(JSON.stringify({ error: 'Valid email is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	// Check if already exists
	const checkResponse = await fetch(
		`${env.SUPABASE_URL}/rest/v1/allowed_emails?email=eq.${encodeURIComponent(email)}&select=status`,
		{
			headers: {
				apikey: env.SUPABASE_SERVICE_ROLE_KEY,
				Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	);

	if (checkResponse.ok) {
		const rows = (await checkResponse.json()) as { status: string }[];
		if (rows.length > 0) {
			if (rows[0].status === 'confirmed') {
				return new Response(JSON.stringify({ alreadyConfirmed: true }), {
					headers: { 'Content-Type': 'application/json' },
				});
			}
			// Already pending
			return new Response(JSON.stringify({ success: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}
	}

	// Insert new pending signup
	const response = await fetch(`${env.SUPABASE_URL}/rest/v1/allowed_emails`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			apikey: env.SUPABASE_SERVICE_ROLE_KEY,
			Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
			Prefer: 'return=minimal',
		},
		body: JSON.stringify({ email, status: 'pending' }),
	});

	if (!response.ok) {
		const error = await response.text();
		console.error('Beta signup insert failed:', error);
		return new Response(JSON.stringify({ error: 'Failed to sign up' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	return new Response(JSON.stringify({ success: true }), {
		headers: { 'Content-Type': 'application/json' },
	});
};
