import { createClient, SupabaseClient } from "@supabase/supabase-js";

const { SUPABASE_URL = "", SUPABASE_SERVICE_ROLE_KEY = "" } = process.env;

export function getSupabaseService(): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase env vars");
  }
  
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
    }
  );
}

// For compatibility with existing code, but only create if env vars are available
export const supabaseService: SupabaseClient | null = 
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY 
    ? createClient(
        SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
        }
      )
    : null;
