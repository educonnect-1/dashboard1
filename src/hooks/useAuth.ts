import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  user: Profile | null;
  session: any;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .eq('role', 'teacher')
          .single();

        if (profile) {
          set({ user: profile as Profile, session, loading: false, initialized: true });
        } else {
          // Not a teacher - sign out
          await supabase.auth.signOut();
          set({ user: null, session: null, loading: false, initialized: true });
        }
      } else {
        set({ loading: false, initialized: true });
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({ user: null, session: null });
        } else if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .eq('role', 'teacher')
            .single();

          if (profile) {
            set({ user: profile as Profile, session });
          } else {
            await supabase.auth.signOut();
            set({ user: null, session: null });
          }
        } else if (event === 'TOKEN_REFRESHED') {
          set({ session });
        }
      });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ loading: false, initialized: true });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .eq('role', 'teacher')
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          throw new Error('Access denied. This dashboard is for the teacher only.');
        }

        set({ user: profile as Profile, session: data.session, loading: false });
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  refreshProfile: async () => {
    const { session } = get();
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      if (profile) {
        set({ user: profile as Profile });
      }
    }
  },
}));
