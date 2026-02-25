import { supabase } from '@/lib/supabase/client';
import Constants from 'expo-constants';

interface LoginResult {
  message: string;
}

interface DevLoginResult {
  session: unknown;
}

export async function loginWithOtp(email: string): Promise<LoginResult> {
  const scheme = Constants.expoConfig?.scheme ?? 'mrblu';
  const redirectUrl = `${scheme}://auth/callback`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    throw new AuthError(error.message, parseRetryAfter(error));
  }

  return { message: 'Magic link sent' };
}

export async function devLogin(email: string, password: string): Promise<DevLoginResult> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(error.message);
  }

  return { session: data.session };
}

export async function verifyOtp(email: string, token: string): Promise<DevLoginResult> {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    throw new AuthError(error.message);
  }

  return { session: data.session };
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new AuthError(error.message);
  }
}

function parseRetryAfter(error: { message: string; status?: number }): number | undefined {
  if (error.status === 429) {
    const match = error.message.match(/(\d+)\s*second/i);
    return match ? Number(match[1]) : 60;
  }
  return undefined;
}

export class AuthError extends Error {
  retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = 'AuthError';
    this.retryAfter = retryAfter;
  }
}
