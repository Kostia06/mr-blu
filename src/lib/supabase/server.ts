import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY } from '$env/static/public';
import { dev } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

// 30 days in seconds
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export function createClient(cookies: Cookies) {
	return createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
		cookies: {
			getAll: () => cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					cookies.set(name, value, {
						...options,
						path: '/',
						maxAge: COOKIE_MAX_AGE,
						sameSite: 'lax',
						secure: !dev // Only secure in production (HTTPS)
					});
				});
			}
		}
	});
}
