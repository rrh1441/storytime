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
  const { pathname } = req.nextUrl;
  console.log(`--- MW for: ${pathname} ---`);

  /* --- 2. Skip auth for public routes ----------------------------------- */
  if (isPublic(pathname)) {
    return NextResponse.next(); // allow through untouched
  }

  /* --- 3. Auth-gated routes -------------------------------------------- */
  const { client: supabase, response } = createMiddlewareClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();

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
  if (session) {x
    const { data: { user } } = await supabase.auth.getUser();
    if (user) headers.set('x-user-info', JSON.stringify(user));
  }

  const res = NextResponse.next({ request: { headers } });

  // copy refreshed cookies from Supabase helper
  response.cookies.getAll().forEach((c) =>
    res.cookies.set(c.name, c.value, c),
  );

  return res;
}
