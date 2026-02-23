import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@mrblu/shared/types';

let supabaseInstance: SupabaseClient<Database> | null = null;

export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createClient<Database>(url, anonKey);
  return supabaseInstance;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!supabaseInstance) {
    throw new Error('Supabase not initialized. Call createSupabaseClient first.');
  }
  return supabaseInstance;
}
