import { createClient, SupabaseClient } from "@supabase/supabase-js";

const { SUPABASE_URL = "", SUPABASE_SERVICE_ROLE_KEY = "" } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
  throw new Error("Missing Supabase env vars");

export const supabaseService: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } }
  }
);
