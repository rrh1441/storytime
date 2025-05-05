// src/lib/supabase/server.ts (Cleaned)
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const createClient = (): SupabaseClient => {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        // @ts-expect-error - Still needed for TS check
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          // @ts-expect-error - Still needed for TS check
          cookieStore.set({ name, value, ...options });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) { // Keep eslint disable for unused var
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          // @ts-expect-error - Still needed for TS check
          cookieStore.set({ name, value: "", ...options });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) { // Keep eslint disable for unused var
        }
      },
    },
  });
};

export const getUser = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error.message);
    return { user: null };
  }
  return { user: data.user };
};

export const getSession = async () => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting session:", error.message);
    return { session: null };
  }
  return { session: data.session };
};