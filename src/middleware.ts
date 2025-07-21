// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/* --- 1. Declare public, no-auth routes ----------------------------------- */
const PUBLIC_PATHS = [
  '/',          // hero landing
  '/quick',     // anonymous mini-wizard
  '/login',
  '/signup',
  '/privacy',
  '/pricing',
  '/contact',
  '/s',         // parent path for /s/[id]
];

/* Helper: does pathname start with any public route? */
function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(req: NextRequest) {
  try {
    const { pathname } = req.nextUrl;
    console.log(`--- MW for: ${pathname} ---`);

    /* --- 2. Skip auth for public routes ----------------------------------- */
    if (isPublic(pathname)) {
      return NextResponse.next(); // allow through untouched
    }

    /* --- 3. Auth-gated routes -------------------------------------------- */
    const { client: supabase, response } = createMiddlewareClient(req);
    
    // Add timeout for Supabase operations
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Session timeout')), 5000)
    );
    
    const {
      data: { session },
    } = await Promise.race([sessionPromise, timeoutPromise]);

    const isLogin = pathname === '/login';

    // No session → send to /login
    if (!session && !isLogin) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    // Already logged in → keep them off /login
    if (session && isLogin) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    /* --- 4. (Optional) forward user info header -------------------------- */
    const headers = new Headers(req.headers);
    if (session) {
      try {
        const userPromise = supabase.auth.getUser();
        const userTimeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('User fetch timeout')), 3000)
        );
        
        const { data: { user } } = await Promise.race([userPromise, userTimeoutPromise]);
        if (user) headers.set('x-user-info', JSON.stringify(user));
      } catch (userError) {
        console.warn('Failed to fetch user info:', userError);
        // Continue without user info
      }
    }

    const res = NextResponse.next({ request: { headers } });

    // copy refreshed cookies from Supabase helper
    response.cookies.getAll().forEach((c) =>
      res.cookies.set(c.name, c.value, c),
    );

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    // Allow request through on middleware errors to prevent 500s
    return NextResponse.next();
  }
}
