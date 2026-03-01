import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase/client';

interface LoginResult {
  message: string;
}

interface SignUpResult {
  requiresConfirmation: boolean;
}

interface SessionResult {
  session: unknown;
}

function getRedirectUrl(path: string): string {
  if (Capacitor.isNativePlatform()) {
    return `mrblu://auth/callback?next=${path}`;
  }
  return `${window.location.origin}/auth/callback?next=${path}`;
}

async function checkWhitelist(email: string): Promise<void> {
  const { data, error } = await supabase.rpc('is_email_allowed', { check_email: email });
  if (error || !data) {
    throw new AuthError('auth.emailNotWhitelisted');
  }
}

export async function loginWithOtp(email: string): Promise<LoginResult> {
  await checkWhitelist(email);

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getRedirectUrl('/dashboard'),
    },
  });

  if (error) {
    throw new AuthError(error.message, parseRetryAfter(error));
  }

  return { message: 'Magic link sent' };
}

export async function signUpWithPassword(email: string, password: string): Promise<SignUpResult> {
  await checkWhitelist(email);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl('/dashboard'),
    },
  });

  if (error) {
    throw new AuthError(error.message, parseRetryAfter(error));
  }

  const isExistingUser = data.user?.identities?.length === 0;
  if (isExistingUser) {
    throw new AuthError('auth.emailAlreadyRegistered');
  }

  return { requiresConfirmation: !data.session };
}

export async function loginWithPassword(email: string, password: string): Promise<SessionResult> {
  await checkWhitelist(email);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new AuthError(error.message, parseRetryAfter(error));
  }

  return { session: data.session };
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl('/reset-password'),
  });

  if (error) {
    throw new AuthError(error.message, parseRetryAfter(error));
  }
}

export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    throw new AuthError(error.message);
  }
}

export async function verifyOtp(email: string, token: string): Promise<SessionResult> {
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
