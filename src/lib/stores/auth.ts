import { writable, derived } from 'svelte/store';
import type { User, Session } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);

export const isAuthenticated = derived(session, ($session) => !!$session);

export const userProfile = derived(user, ($user) => {
	if (!$user) return null;
	return {
		id: $user.id,
		email: $user.email,
		name: $user.user_metadata?.full_name || $user.email?.split('@')[0]
	};
});
