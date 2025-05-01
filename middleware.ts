import { NextRequest, NextResponse } from "next/server";

export const config = { matcher: "/:path*" };

export function middleware(req: NextRequest) {
  console.log("MIDDLEWARE HIT →", req.nextUrl.pathname);
  return req.cookies.get("sb-access-token")
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/login", req.url));
}
