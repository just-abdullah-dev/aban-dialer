/**
 * Next.js Proxy
 *
 * Protects authenticated routes - redirects to /login if not authenticated.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

// Routes that require authentication
const protectedRoutes = ["/dialer", "/contacts", "/history", "/dashboard", "/settings"];

// Routes that should redirect to /dialer if already authenticated
const authRoutes = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires protection
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Get session token
  const token = request.cookies.get("aban_dialer_session")?.value;
  const session = token ? await verifySession(token) : null;

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dialer if accessing auth route with valid session
  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dialer", request.url));
  }

  return NextResponse.next();
}

// Configure which routes use this proxy
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
