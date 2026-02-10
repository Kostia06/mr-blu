import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
			/** @deprecated Use safeGetSession instead */
			getSession: () => Promise<Session | null>;
		}
		interface PageData {
			session?: Session | null;
			user?: User | null;
		}
		interface Platform {
			env: {
				R2: R2Bucket;
				MYBROWSER: { fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response> };
				DEEPGRAM_API_KEY: string;
				TWILIO_ACCOUNT_SID: string;
				TWILIO_AUTH_TOKEN: string;
				TWILIO_PHONE_NUMBER: string;
				RESEND_API_KEY: string;
				SUPABASE_SERVICE_ROLE_KEY: string;
			};
		}
	}
}

export {};
