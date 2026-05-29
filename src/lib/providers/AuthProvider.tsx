import { Session } from '@supabase/supabase-js';
import React, { createContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { supabase } from '@/lib/supabase';
import { Tables } from '@/lib/types/database';

type UserProfile = Tables<'user_profiles'>;

interface SignUpResult {
  error: Error | null;
  /** True when the project requires email confirmation, so no session was
   *  created yet and the restaurant can't be set up until the user confirms. */
  needsEmailConfirmation: boolean;
}

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  createRestaurant: (input: {
    restaurantName: string;
    fullName: string;
    currency?: string;
  }) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsEmailConfirmation: false }),
  createRestaurant: async () => ({ error: null }),
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Monotonic token so that, when several profile fetches overlap (e.g. the
  // auth listener fires while we're mid-signup), only the most recently started
  // one is allowed to write state. Prevents a stale "no profile yet" result
  // from clobbering a freshly created profile.
  const fetchSeq = useRef(0);

  useEffect(() => {
    let initialDone = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      initialDone = true;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialDone) return; // Skip the initial event — getSession handles it
      setSession(session);
      if (session?.user) {
        setLoading(true);
        fetchProfile(session.user.id);
      } else {
        fetchSeq.current++; // invalidate any in-flight fetch
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string) {
    const seq = ++fetchSeq.current;
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (seq !== fetchSeq.current) return; // superseded by a newer fetch

    if (error) {
      console.error('Error fetching profile:', error.message);
      setProfile(null);
      setLoading(false);
      return;
    }

    // Deactivated accounts are blocked even though the JWT is still valid.
    // (The DB also denies them all tenant data via get_my_restaurant_id().)
    if (data && !data.is_active) {
      setProfile(null);
      setLoading(false);
      await supabase.auth.signOut();
      Alert.alert(
        'Account Deactivated',
        'Your account has been deactivated. Please contact your administrator.',
      );
      return;
    }

    setProfile(data);
    setLoading(false);
  }

  async function refreshProfile() {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await fetchProfile(data.session.user.id);
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  }

  async function signUp(email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return { error: new Error(error.message), needsEmailConfirmation: false };
    }
    // No session means the project has email confirmation enabled.
    return { error: null, needsEmailConfirmation: !data.session };
  }

  async function createRestaurant({
    restaurantName,
    fullName,
    currency = 'GBP',
  }: {
    restaurantName: string;
    fullName: string;
    currency?: string;
  }) {
    const { error } = await supabase.rpc('create_restaurant_for_current_user', {
      restaurant_name: restaurantName,
      admin_full_name: fullName,
      currency,
    });
    if (error) return { error: new Error(error.message) };

    await refreshProfile();
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading,
        signIn,
        signUp,
        createRestaurant,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
