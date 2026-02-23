import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  userProfile: { id: string; email: string | undefined; name: string } | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isAuthenticated: false,
  userProfile: null,
  setSession: (session) => set({ session, isAuthenticated: !!session }),
  setUser: (user) =>
    set({
      user,
      userProfile: user
        ? {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          }
        : null,
    }),
}));
