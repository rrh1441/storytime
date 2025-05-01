import { createBrowserClient, createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const getBrowserClient = (): SupabaseClient =>
  createBrowserClient(URL, KEY);

export const getServerClient = (): SupabaseClient =>
  createServerClient(URL, KEY, {
    cookies: { getAll: () => [], setAll: () => {} } as any,
  });

export const getUser = async () => {
  const { data } = await getServerClient().auth.getUser();
  return { user: data.user };
};
