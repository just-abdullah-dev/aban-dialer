/**
 * API Route: Bulk Delete Leads
 * POST /api/leads/bulk-delete
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400 }
      );
    }

    console.log(`🗑️ Bulk deleting ${ids.length} leads...`);

    // Delete all leads with the given IDs
    const result = await prisma.lead.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    console.log(`✅ Deleted ${result.count} leads`);

    return NextResponse.json({
      success: true,
      deleted: result.count,
      message: `Successfully deleted ${result.count} lead(s)`,
    });
  } catch (error) {
    console.error("Error bulk deleting leads:", error);
    return NextResponse.json(
      {
        error: "Failed to delete leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
