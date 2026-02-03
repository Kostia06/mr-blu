import { vi } from 'vitest';

// Mock Supabase client
export const mockSupabaseClient = {
	auth: {
		getUser: vi.fn().mockResolvedValue({
			data: {
				user: {
					id: 'test-user-id',
					email: 'test@example.com'
				}
			},
			error: null
		}),
		getSession: vi.fn().mockResolvedValue({
			data: {
				session: {
					user: {
						id: 'test-user-id',
						email: 'test@example.com'
					},
					access_token: 'test-access-token'
				}
			},
			error: null
		}),
		signInWithOtp: vi.fn().mockResolvedValue({ data: {}, error: null }),
		signOut: vi.fn().mockResolvedValue({ error: null }),
		onAuthStateChange: vi.fn().mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } }
		})
	},
	from: vi.fn().mockReturnValue({
		select: vi.fn().mockReturnThis(),
		insert: vi.fn().mockReturnThis(),
		update: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		neq: vi.fn().mockReturnThis(),
		gt: vi.fn().mockReturnThis(),
		gte: vi.fn().mockReturnThis(),
		lt: vi.fn().mockReturnThis(),
		lte: vi.fn().mockReturnThis(),
		like: vi.fn().mockReturnThis(),
		ilike: vi.fn().mockReturnThis(),
		order: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		single: vi.fn().mockResolvedValue({ data: null, error: null }),
		maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
	})
};

// Factory function to create mock clients with custom behaviors
export function createMockSupabaseClient(overrides?: Partial<typeof mockSupabaseClient>) {
	return {
		...mockSupabaseClient,
		...overrides
	};
}

// Mock the createClient function
vi.mock('$lib/supabase/client', () => ({
	createClient: vi.fn(() => mockSupabaseClient)
}));

// Mock the server client
vi.mock('$lib/supabase/server', () => ({
	createClient: vi.fn(() => mockSupabaseClient)
}));
