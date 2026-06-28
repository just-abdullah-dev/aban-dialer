/**
 * API Route: Call Status Webhook
 *
 * POST /api/voice/status-callback
 * Receives call status updates from Twilio (initiated, ringing, answered, completed)
 */

import { NextRequest, NextResponse } from "next/server";
import { getTelephonyProvider } from "@/lib/telephony/factory";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const formData = new URLSearchParams(body);
    const payload = Object.fromEntries(formData.entries());

    console.log("Call status webhook received:", payload);

    const provider = getTelephonyProvider();

    // Parse the webhook into normalized format
    const event = provider.parseStatusWebhook(payload);

    // Update call record in database
    const callSid = event.providerCallId;
    const status = event.status;

    // Find or create call record
    const existingCall = await prisma.call.findFirst({
      where: { providerCallId: callSid },
    });

    if (existingCall) {
      await prisma.call.update({
        where: { id: existingCall.id },
        data: {
          status,
          durationSeconds: event.durationSeconds,
          ...(status === "in-progress" && !existingCall.answeredAt ? { answeredAt: new Date() } : {}),
          ...(["completed", "failed", "busy", "no-answer", "canceled"].includes(status) && !existingCall.endedAt ? { endedAt: new Date() } : {}),
        },
      });
    } else {
      // Create new call record if it doesn't exist
      // Try to find the Number record for fromNumberId (default to first active number)
      const fromNumber = await prisma.number.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      if (!fromNumber) {
        console.error("No active phone number found in database");
        return NextResponse.json({ error: "No active phone number configured" }, { status: 500 });
      }

      await prisma.call.create({
        data: {
          providerCallId: callSid,
          fromNumberId: fromNumber.id,
          toNumber: payload.To || payload.Called || "unknown",
          providerName: "twilio",
          status,
          durationSeconds: event.durationSeconds,
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing status webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
