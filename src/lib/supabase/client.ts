import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient | null = null;

export function createClient() {
	if (!supabase) {
		supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			auth: {
				persistSession: true,
				storageKey: 'mr-blu-auth',
				storage: typeof window !== 'undefined' ? window.localStorage : undefined,
				autoRefreshToken: true,
				detectSessionInUrl: true
			}
		});
	}
	return supabase;
}
