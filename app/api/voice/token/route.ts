/**
 * API Route: Generate Twilio Access Token
 *
 * POST /api/voice/token
 * Returns a short-lived JWT for browser-based calling via Twilio Voice SDK
 */

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getTelephonyProvider } from "@/lib/telephony/factory";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const provider = getTelephonyProvider();
    const result = await provider.getAccessToken(session.userId);

    return NextResponse.json({
      token: result.token,
      identity: result.identity,
      expiresAt: result.expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Error generating access token:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate token" },
      { status: 500 }
    );
  }
}
