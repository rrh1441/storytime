// Likely located at: src/lib/supabase/middleware.ts
// Or: lib/supabase/middleware.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Get environment variables with fallback  
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Creates a Supabase client and a response object tailored for use in Next.js middleware.
 *
 * This function initializes the Supabase client using the `@supabase/ssr` package,
 * configuring it to read cookies from the incoming request and set cookies on
 * an outgoing response object. This response object should have its cookies merged
 * into the final response returned by the middleware.
 *
 * @param req - The incoming NextRequest object from the middleware function.
 * @returns An object containing:
 * - `client`: An initialized SupabaseClient instance for middleware use.
 * - `response`: A NextResponse object that accumulates any cookies set by Supabase operations.
 */
export const createMiddlewareClient = (
    req: NextRequest,
): { client: SupabaseClient; response: NextResponse } => {

    // Create a NextResponse object that we can modify and return.
    // It's initialized by cloning the request headers to ensure continuity.
    const response = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    // Check if environment variables are available
    if (!supabaseUrl || !supabaseAnonKey) {
        console.warn('Supabase environment variables not available, creating mock client');
        // Return a mock client that won't cause errors
        return { 
            client: {} as SupabaseClient, 
            response 
        };
    }

    // Initialize the Supabase client using createServerClient from @supabase/ssr.
    // Provide it with functions to get, set, and remove cookies using the
    // NextRequest and the NextResponse object created above.
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            /**
             * Reads a cookie value from the incoming request.
             * @param name - The name of the cookie to read.
             * @returns The cookie value or undefined if not found.
             */
            get(name: string): string | undefined {
                return req.cookies.get(name)?.value;
            },
            /**
             * Sets a cookie on the response object. Called by Supabase when session
             * needs to be persisted (e.g., after login, token refresh).
             * @param name - The name of the cookie.
             * @param value - The value of the cookie.
             * @param options - Cookie options (domain, path, maxAge, etc.).
             */
            set(name: string, value: string, options: CookieOptions): void {
                // Use the `response` object's cookie API to set the cookie.
                response.cookies.set({ name, value, ...options });
            },
            /**
             * Removes a cookie by setting an expired cookie on the response object.
             * Called by Supabase during sign-out.
             * @param name - The name of the cookie to remove.
             * @param options - Cookie options (domain, path).
             */
            remove(name: string, options: CookieOptions): void {
                 // Use the `response` object's cookie API to set an expired cookie.
                response.cookies.set({ name, value: "", ...options });
            },
        },
    });

    // Return both the Supabase client and the response object.
    // The middleware function will use the client for auth checks and
    // merge the cookies from this response object into its final response.
    return { client: supabase, response };
};

// You could potentially add other middleware-specific Supabase helpers here if needed.