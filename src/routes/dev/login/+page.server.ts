import { redirect, fail, error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { dev } from '$app/environment';

// Only allow this route in development
export const load: PageServerLoad = async ({ locals }) => {
	if (!dev) {
		throw error(404, 'Not found');
	}

	// Redirect logged-in users to dashboard
	if (locals.session) {
		throw redirect(303, '/dashboard');
	}

	return {};
};

export const actions: Actions = {
	login: async ({ request, locals }) => {
		if (!dev) {
			throw error(404, 'Not found');
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const { data, error: authError } = await locals.supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError) {
			console.error('Dev login error:', authError);
			return fail(400, { error: authError.message, email });
		}

		if (data.session) {
			throw redirect(303, '/dashboard');
		}

		return fail(400, { error: 'Login failed', email });
	},

	signup: async ({ request, locals }) => {
		if (!dev) {
			throw error(404, 'Not found');
		}

		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', email });
		}

		const { data, error: authError } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				// Skip email confirmation in dev
				emailRedirectTo: undefined
			}
		});

		if (authError) {
			console.error('Dev signup error:', authError);
			return fail(400, { error: authError.message, email });
		}

		// In dev, Supabase might auto-confirm users depending on settings
		if (data.session) {
			throw redirect(303, '/dashboard');
		}

		return {
			success: true,
			message: 'Account created! Check your email for confirmation or try logging in.',
			email
		};
	}
};
