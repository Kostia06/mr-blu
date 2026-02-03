import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { rateLimiters, getClientIdentifier, isValidEmail } from '$lib/server/security';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Redirect logged-in users to dashboard
	if (locals.session) {
		throw redirect(303, '/dashboard');
	}

	const errorParam = url.searchParams.get('error');
	let urlError: string | null = null;

	if (errorParam) {
		// Map common Supabase errors to translation keys
		if (errorParam.includes('expired') || errorParam.includes('invalid')) {
			urlError = 'auth.linkExpired';
		} else {
			urlError = 'auth.genericError';
		}
	}

	return { urlError };
};

export const actions: Actions = {
	login: async ({ request, locals, url }) => {
		// Rate limit by IP address
		const clientId = getClientIdentifier(request);
		const rateLimit = rateLimiters.auth(clientId);

		if (!rateLimit.allowed) {
			const retryAfter = Math.ceil(rateLimit.resetIn / 1000);
			return fail(429, {
				error: 'auth.tooManyAttempts',
				retryAfter,
				email: ''
			});
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;

		// Validate email presence
		if (!email) {
			return fail(400, { error: 'auth.emailRequired', email: '' });
		}

		// Validate email format
		if (!isValidEmail(email)) {
			return fail(400, { error: 'auth.invalidEmail', email });
		}

		const { error } = await locals.supabase.auth.signInWithOtp({
			email,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback?next=/dashboard`
			}
		});

		if (error) {
			// Log full error for debugging
			console.error('Auth error:', {
				message: error.message,
				status: error.status,
				name: error.name,
				code: (error as any).code
			});
			return fail(400, { error: 'auth.unableToSendLink', email });
		}

		return { success: true, email };
	}
};
