/**
 * API Route: Recording Webhook
 *
 * POST /api/voice/recording-callback
 * Receives notification when call recording is ready
 */

import { NextRequest, NextResponse } from "next/server";
import { getTelephonyProvider } from "@/lib/telephony/factory";
import { getStorageProvider } from "@/lib/storage/factory";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const formData = new URLSearchParams(body);
    const payload = Object.fromEntries(formData.entries());

    console.log("Recording webhook received:", payload);

    const recordingSid = payload.RecordingSid;
    const recordingUrl = payload.RecordingUrl;
    const callSid = payload.CallSid;
    const duration = parseInt(payload.RecordingDuration || "0", 10);

    if (!recordingSid || !recordingUrl || !callSid) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the call record
    const call = await prisma.call.findFirst({
      where: { providerCallId: callSid },
    });

    if (!call) {
      console.error(`Call not found for CallSid: ${callSid}`);
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // Download recording from Twilio
    const telephonyProvider = getTelephonyProvider();
    const recordingBytes = await telephonyProvider.fetchRecordingBytes(
      `${recordingUrl}.mp3`
    );

    // Upload to storage provider
    const storageProvider = getStorageProvider();
    const fileName = `recordings/${callSid}_${recordingSid}.mp3`;
    const uploadResult = await storageProvider.upload({
      key: fileName,
      buffer: recordingBytes,
      contentType: "audio/mpeg",
      metadata: {
        callSid,
        recordingSid,
        duration: duration.toString(),
      },
    });

    // Update call record with storage info
    await prisma.call.update({
      where: { id: call.id },
      data: {
        recordingStorageProvider: uploadResult.storageProvider,
        recordingStorageKey: uploadResult.key,
        durationSeconds: duration,
      },
    });

    console.log(`Recording saved: ${uploadResult.key}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing recording webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
