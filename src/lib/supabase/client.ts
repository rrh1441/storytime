/**
 * Client-side Supabase singleton (browser only)
 * Uses the modern `@supabase/ssr` helpers.
 */
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  // During build time or when env vars are missing, return null
  if (typeof window === 'undefined') {
    return null;
  }
  
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.warn('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    return null;
  }

  _client = createBrowserClient(url, key, {
    cookieOptions: { maxAge: 60 * 60 * 24 * 30 }, // 30 days
  });

  return _client;
}
