// src/context/AuthContext.tsx
// Updated: Uses Next.js compatible client, includes migrated auth methods.
'use client';

import React, { // Use React import
 createContext,
 useContext,
 useEffect,
 useState,
 useMemo,
 ReactNode,
 useCallback,
} from 'react';
import type { Session, SupabaseClient, User, AuthError } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client'; // Ensure this imports the browser client

// Define UserProfile based on your actual DB structure if needed
// Fetched separately. Ensure columns match your DB.
type UserProfile = {
 id: string;
 name: string | null;
 email: string | null;
 subscription_status: string | null;
 active_plan_price_id: string | null;
 monthly_minutes_limit: number | null;
 minutes_used_this_period: number | null;
 // Add other fields as needed
} | null;

export interface AuthCtx {
 user: User | null;
 session: Session | null;
 profile: UserProfile;
 loading: boolean;
 supabase: SupabaseClient;
 login: (args: {
  email: string;
  password?: string;
  provider?: 'google' | 'github'; // Define supported providers
 }) => Promise<{ error: AuthError | null }>;
 signup: (args: {
  email: string;
  password: string;
  options?: { data?: Record<string, unknown>; emailRedirectTo?: string };
 }) => Promise<{ error: AuthError | null }>;
 logout: () => Promise<{ error: AuthError | null }>;
 refetchProfile: () => Promise<void>; // Add function to manually refetch profile
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
 const supabase = getSupabaseClient(); // Get browser client instance

 const [session, setSession] = useState<Session | null>(null);
 const [user, setUser] = useState<User | null>(null);
 const [profile, setProfile] = useState<UserProfile>(null);
 const [loading, setLoading] = useState(true);

 /* Fetch Profile Helper */
 const fetchProfile = useCallback(async (userId: string | undefined) => {
  if (!userId) {
   setProfile(null);
   return;
  }
  try {
   console.log('[AuthProvider] Fetching profile for user:', userId);
   const { data, error, status } = await supabase
    .from('users') // Ensure this is your actual users table name
    .select('id, name, email, subscription_status, active_plan_price_id, monthly_minutes_limit, minutes_used_this_period') // Specify columns
    .eq('id', userId)
    .single();

   if (error && status !== 406) { // 406: No row found is acceptable
    console.error('[AuthProvider] fetchProfile error:', error);
    setProfile(null); // Reset profile on error
   } else {
    console.log('[AuthProvider] Profile fetched:', data);
    setProfile(data ?? null);
   }
  } catch (err) {
   console.error('[AuthProvider] fetchProfile exception:', err);
   setProfile(null); // Reset profile on exception
  }
 }, [supabase]);

 /* Manual Profile Refetch */
 const refetchProfile = useCallback(async () => {
    if (user?.id) {
        await fetchProfile(user.id);
    }
 }, [user?.id, fetchProfile]);

 /* Initial load + auth listener */
 useEffect(() => {
  let mounted = true;

  async function getInitialSession() {
   try {
    const { data: { session: initialSession }, error } = await supabase.auth.getSession();
    if (error) {
     console.error('[AuthProvider] getSession error on initial load:', error);
     throw error;
    }
    if (!mounted) return;

    console.log('[AuthProvider] Initial session received:', initialSession);
    setSession(initialSession);
    const initialUser = initialSession?.user ?? null;
    setUser(initialUser);
    await fetchProfile(initialUser?.id);
   } catch (err) {
    console.error('[AuthProvider] Error during initial session fetch:', err);
    setSession(null); // Ensure state is null on error
    setUser(null);
    setProfile(null);
   } finally {
    if (mounted) setLoading(false);
   }
  }

  getInitialSession();

  const { data: listener } = supabase.auth.onAuthStateChange(
   async (_event, newSession) => {
    if (!mounted) return;
    console.log('[AuthProvider] Auth state changed:', _event, newSession);
    const newUserData = newSession?.user ?? null;
    const currentUserId = user?.id; // Get current user ID *before* state update

    setSession(newSession);
    setUser(newUserData);

    // Fetch profile only if user ID changes or user logs in/out
    if (newUserData?.id !== currentUserId) {
     await fetchProfile(newUserData?.id);
    } else if (!newUserData && currentUserId) { // User logged out
        setProfile(null);
    }

    // Ensure loading is false after the first event
    if (loading) setLoading(false);
   },
  );

  return () => {
   mounted = false;
   listener.subscription.unsubscribe();
  };
  // Ensure fetchProfile doesn't cause infinite loops if its identity changes unexpectedly
 }, [supabase, fetchProfile, loading, user?.id]);


 /* Auth Actions */
 const login = useCallback(
  async (args: { email: string; password?: string; provider?: 'google' | 'github'; }) => {
   let result: { error: AuthError | null };
   if (args.provider) {
    // For OAuth, the redirect happens, error handled on callback page typically
    const { error } = await supabase.auth.signInWithOAuth({ provider: args.provider });
    result = { error };
   } else if (args.password) {
    const { error } = await supabase.auth.signInWithPassword({ email: args.email, password: args.password });
    result = { error };
   } else {
    result = { error: { name: "AuthApiError", message: "Password required for email login." } as AuthError };
   }
   // Listener will handle state update
   return result;
  },
  [supabase]
 );

 const signup = useCallback(
  async (args: { email: string; password: string; options?: { data?: Record<string, unknown>, emailRedirectTo?: string } }) => {
   // Pass user metadata (like name) in options.data
   const { error } = await supabase.auth.signUp({
    email: args.email,
    password: args.password,
    options: args.options,
   });
   // Listener will handle state update. Check data.user if email confirmation is disabled.
   return { error };
  },
  [supabase]
 );

 const logout = useCallback(async () => {
  const { error } = await supabase.auth.signOut();
  // Listener handles state update
  return { error };
 }, [supabase]);


 /* Memoized Context Value */
 const value = useMemo<AuthCtx>(
  () => ({ user, session, profile, loading, supabase, login, signup, logout, refetchProfile }),
  [user, session, profile, loading, supabase, login, signup, logout, refetchProfile]
 );

 return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* Hook */
export function useAuth(): AuthCtx {
 const ctx = useContext(Ctx);
 if (ctx === undefined) {
  throw new Error('useAuth must be used within an AuthProvider');
 }
 return ctx;
}