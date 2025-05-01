"use client";
import {
  PropsWithChildren,
  useState,
  useEffect,
  createContext,
  useContext,
} from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { getBrowserClient } from "@/lib/supabase";

type Ctx = { client: SupabaseClient; session: Session | null; user: User | null };

const SupabaseCtx = createContext<Ctx | null>(null);

export const useSupabase = () => {
  const ctx = useContext(SupabaseCtx);
  if (!ctx) throw new Error("SupabaseProvider missing");
  return ctx;
};

export default function SupabaseProvider({ children }: PropsWithChildren<{}>) {
  const [client] = useState(() => getBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [qc] = useState(() => new QueryClient());

  useEffect(() => {
    client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = client.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [client]);

  return (
    <SupabaseCtx.Provider value={{ client, session, user }}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </SupabaseCtx.Provider>
  );
}
