/**
 * API Route: TwiML Generation
 *
 * GET /api/voice/twiml?To=+1234567890&From=+0987654321
 * Returns TwiML instructions for Twilio to execute the call
 */

import { NextRequest, NextResponse } from "next/server";
import { getTelephonyProvider } from "@/lib/telephony/factory";

async function handleTwiml(req: NextRequest) {
  try {
    // Parse parameters from URL query string (for GET) or form data (for POST)
    let toNumber: string | null = null;
    let fromNumber: string | null = null;

    // Try query params first (GET requests or params in URL)
    const searchParams = req.nextUrl.searchParams;
    toNumber = searchParams.get("To");
    fromNumber = searchParams.get("From");

    // If POST, also check form data
    if (req.method === "POST") {
      try {
        const body = await req.text();
        const formData = new URLSearchParams(body);
        toNumber = toNumber || formData.get("To");
        fromNumber = fromNumber || formData.get("From");

        console.log("TwiML POST request received:", Object.fromEntries(formData.entries()));
      } catch (e) {
        console.error("Failed to parse POST body:", e);
      }
    }

    // Use environment variable as fallback for fromNumber
    fromNumber = fromNumber || process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || null;

    console.log("TwiML parameters:", { toNumber, fromNumber });

    if (!toNumber) {
      console.error("Missing 'To' parameter in TwiML request");
      return new NextResponse("Missing 'To' parameter", { status: 400 });
    }

    if (!fromNumber) {
      console.error("Missing 'From' parameter and no TWILIO_PHONE_NUMBER configured");
      return new NextResponse("Missing 'From' parameter or TWILIO_PHONE_NUMBER", { status: 400 });
    }

    const provider = getTelephonyProvider();
    const twiml = provider.buildVoiceResponse({
      toNumber,
      fromNumber,
      record: true, // Enable call recording
    });

    console.log("Generated TwiML successfully for call:", { to: toNumber, from: fromNumber });

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error generating TwiML:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handleTwiml(req);
}

export async function POST(req: NextRequest) {
  return handleTwiml(req);
}
