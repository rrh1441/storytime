/**
 * Client-side Supabase singleton (browser only)
 * Uses the modern `@supabase/ssr` helpers.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    );
  }

  _client = createBrowserClient(url, key, {
    cookieOptions: { lifetime: 60 * 60 * 24 * 30 }, // 30 days
  });

  return _client;
}
