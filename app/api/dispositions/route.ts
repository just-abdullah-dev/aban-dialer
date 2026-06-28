/**
 * API Route: Call Dispositions
 *
 * POST /api/dispositions
 * Creates a disposition record for a completed call
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { callId, outcome, notes } = body;

    // Validate required fields
    if (!callId) {
      return NextResponse.json(
        { error: "Call ID is required" },
        { status: 400 }
      );
    }

    if (!outcome) {
      return NextResponse.json(
        { error: "Outcome is required" },
        { status: 400 }
      );
    }

    // Valid outcomes
    const validOutcomes = [
      "interested",
      "call_back_later",
      "not_interested",
      "voicemail",
      "wrong_number",
      "no_answer",
      "other",
    ];

    if (!validOutcomes.includes(outcome)) {
      return NextResponse.json(
        { error: "Invalid outcome value" },
        { status: 400 }
      );
    }

    // Check if call exists
    const call = await prisma.call.findFirst({
      where: { providerCallId: callId },
    });

    if (!call) {
      return NextResponse.json(
        { error: "Call not found" },
        { status: 404 }
      );
    }

    // Check if disposition already exists
    const existingDisposition = await prisma.disposition.findUnique({
      where: { callId: call.id },
    });

    if (existingDisposition) {
      // Update existing disposition
      const updatedDisposition = await prisma.disposition.update({
        where: { callId: call.id },
        data: {
          outcome,
          notes: notes || null,
        },
      });

      return NextResponse.json({
        success: true,
        disposition: updatedDisposition,
        message: "Disposition updated successfully",
      });
    }

    // Create new disposition
    const disposition = await prisma.disposition.create({
      data: {
        callId: call.id,
        outcome,
        notes: notes || null,
      },
    });

    console.log(`✅ Disposition saved for call ${callId}:`, { outcome, notes: notes ? "yes" : "no" });

    return NextResponse.json({
      success: true,
      disposition,
      message: "Disposition saved successfully",
    });
  } catch (error) {
    console.error("Error saving disposition:", error);
    return NextResponse.json(
      {
        error: "Failed to save disposition",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
