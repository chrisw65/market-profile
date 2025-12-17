import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_MATCHERS = [
  /^\/profiles(\/|$)/,
  /^\/api\/profiles(\/|$)/,
  /^\/api\/campaigns(\/|$)/,
];

function isProtected(pathname: string) {
  return PROTECTED_MATCHERS.some((regex) => regex.test(pathname));
}

function hasSupabaseSession(request: NextRequest) {
  return Boolean(request.cookies.get("sb-access-token")?.value);
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (hasSupabaseSession(request)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/";
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/profiles/:path*", "/api/campaigns/:path*", "/api/profiles/:path*"],
};
