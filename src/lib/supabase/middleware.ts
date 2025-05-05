import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!supabaseAnonKey) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const createMiddlewareClient = (
    req: NextRequest,
): { client: SupabaseClient; response: NextResponse } => {
    let response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return req.cookies.get(name)?.value;
            },
            set(name: string, value: string, options: CookieOptions) {
                req.cookies.set({ name, value, ...options });
                response = NextResponse.next({
                    request: {
                        headers: req.headers,
                    },
                });
                response.cookies.set({ name, value, ...options });
            },
            remove(name: string, options: CookieOptions) {
                req.cookies.set({ name, value: "", ...options });
                response = NextResponse.next({
                    request: {
                        headers: req.headers,
                    },
                });
                response.cookies.set({ name, value: "", ...options });
            },
        },
    });

    return { client: supabase, response };
};