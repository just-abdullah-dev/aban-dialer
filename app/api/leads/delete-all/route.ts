/**
 * API Route: Delete All Leads
 * POST /api/leads/delete-all
 *
 * ⚠️ DANGEROUS OPERATION - Deletes ALL leads from database
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    console.log("⚠️ DELETE ALL LEADS requested...");

    // Count total before deletion
    const totalBefore = await prisma.lead.count();

    if (totalBefore === 0) {
      return NextResponse.json({
        success: true,
        deleted: 0,
        message: "No leads to delete",
      });
    }

    console.log(`🗑️ Deleting ALL ${totalBefore} leads...`);

    // Delete all leads
    const result = await prisma.lead.deleteMany();

    console.log(`✅ Deleted ${result.count} leads (all leads removed)`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted all ${result.count} leads from database`,
    });
  } catch (error) {
    console.error("Error deleting all leads:", error);
    return NextResponse.json(
      {
        error: "Failed to delete all leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
