/**
 * Session Management
 *
 * Simple session-based authentication using JWT tokens in cookies.
 * No external auth service - uses bcrypt + our own users table.
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Session token configuration
const SESSION_COOKIE_NAME = "aban_dialer_session";
const SESSION_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "fallback-secret-change-this-in-production"
);
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  exp: number; // Expiration timestamp
}

/**
 * Creates a new session token
 */
export async function createSession(userId: string, email: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  const token = await new SignJWT({
    userId,
    email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(SESSION_SECRET);

  return token;
}

/**
 * Verifies and decodes a session token
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      exp: payload.exp as number,
    };
  } catch (error) {
    console.error("Failed to verify session:", error);
    return null;
  }
}

/**
 * Gets the current session from cookies (server-side)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return await verifySession(token);
}

/**
 * Sets session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Clears session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Middleware helper: Requires authentication
 * Returns session if authenticated, null if not
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionPayload; response?: never } | { session?: never; response: NextResponse }> {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized - No session token" },
        { status: 401 }
      ),
    };
  }

  const session = await verifySession(token);

  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Unauthorized - Invalid or expired session" },
        { status: 401 }
      ),
    };
  }

  return { session };
}
