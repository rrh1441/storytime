'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from 'react';
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

/* ───────────── Types ───────────── */
export interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  supabase: SupabaseClient;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

/* ───────────── Provider ─────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabaseClient();

  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* initial load + auth listener */
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      })
      .catch((err) => {
        console.error('AuthContext getSession error', err);
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthCtx>(
    () => ({ user, session, loading, supabase }),
    [user, session, loading, supabase],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/* ───────────── Hook ─────────────── */
export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
