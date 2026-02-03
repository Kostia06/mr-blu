import { createClient } from '$lib/supabase/server';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { dev } from '$app/environment';
import { getAllSecurityHeaders, getHSTSHeader } from '$lib/server/security/headers';
import { logger } from '$lib/server/logger';

// CSRF protection hook
const csrf: Handle = async ({ event, resolve }) => {
	if (event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		const origin = event.request.headers.get('origin');
		const host = event.request.headers.get('host');

		if (!dev && origin) {
			const originUrl = new URL(origin);
			if (originUrl.host !== host) {
				return new Response('Forbidden - CSRF check failed', { status: 403 });
			}
		}
	}
	return resolve(event);
};

// Supabase client and auth hook
const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createClient(event.cookies);

	// Helper to handle invalid refresh tokens by signing out
	const handleAuthError = async (error: { code?: string } | null) => {
		if (error?.code === 'refresh_token_not_found' || error?.code === 'session_not_found') {
			await event.locals.supabase.auth.signOut();
			return true;
		}
		return false;
	};

	// Call getUser() eagerly to validate and suppress internal getSession() warnings
	// This must happen BEFORE any other Supabase operations (DB queries, etc.)
	const {
		data: { user: validatedUser },
		error: userError
	} = await event.locals.supabase.auth.getUser();

	if (userError) {
		await handleAuthError(userError);
	}

	// Cache the validated user
	const cachedUser = { user: validatedUser, error: userError as Error | null };

	// Validate user function returns cached result
	const validateUser = async () => cachedUser;

	// Secure session getter using getUser() only - avoids Supabase security warning
	// The Supabase SSR package handles access tokens automatically via cookies
	event.locals.safeGetSession = async () => {
		const { user, error } = await validateUser();

		if (error || !user) {
			return { session: null, user: null };
		}

		// Create a session-like object with the validated user
		// Access tokens are handled automatically by the Supabase SSR client via cookies
		const session = {
			user,
			access_token: '', // Not needed - SSR client handles this via cookies
			refresh_token: '', // Not needed - SSR client handles this via cookies
			expires_at: 0,
			expires_in: 0,
			token_type: 'bearer' as const
		};

		return { session, user };
	};

	// Legacy getSession for backwards compatibility - deprecated, use locals.session instead
	event.locals.getSession = async () => {
		const { session } = await event.locals.safeGetSession();
		return session;
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

// Auth guard hook
const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Protected routes that require authentication
	const protectedRoutes = ['/dashboard', '/documents', '/settings', '/admin'];
	const isProtectedRoute = protectedRoutes.some((route) => event.url.pathname.startsWith(route));

	if (isProtectedRoute && !session) {
		throw redirect(303, `/login?redirectTo=${event.url.pathname}`);
	}

	// Admin routes require admin role
	if (event.url.pathname.startsWith('/admin') && session) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user?.id)
			.single();

		if (!profile || profile.role !== 'admin') {
			throw redirect(303, '/dashboard');
		}
	}

	// Redirect authenticated users away from login page
	if (event.url.pathname === '/login' && session) {
		throw redirect(303, '/dashboard');
	}

	return resolve(event);
};

// Security headers hook
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	// Apply security headers to all responses
	const headers = getAllSecurityHeaders();
	for (const [key, value] of Object.entries(headers)) {
		response.headers.set(key, value);
	}

	// Add HSTS header in production
	const hstsHeader = getHSTSHeader();
	if (hstsHeader) {
		response.headers.set('Strict-Transport-Security', hstsHeader);
	}

	return response;
};

export const handle = sequence(csrf, supabase, authGuard, securityHeaders);

export const handleError: HandleServerError = async ({ error, event, status, message }) => {
	const err = error instanceof Error ? error : new Error(String(error));

	// Don't log 404s as errors
	if (status !== 404) {
		logger.error('unhandled_server_error', err.message, {
			stack: err.stack,
			user_id: event.locals.user?.id,
			request_path: event.url.pathname,
			request_method: event.request.method,
			status_code: status,
			metadata: { userAgent: event.request.headers.get('user-agent') }
		});
	}

	return {
		message: dev ? message : 'An unexpected error occurred',
		status
	};
};
