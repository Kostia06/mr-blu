export interface Env {
  GEMINI_API_KEY: string;
  DEEPGRAM_API_KEY: string;
  RESEND_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  EMAIL_FROM_DOMAIN: string;
}

export interface AuthenticatedData {
  user: { id: string; email: string };
}

export type AppContext = EventContext<Env, string, AuthenticatedData>;
