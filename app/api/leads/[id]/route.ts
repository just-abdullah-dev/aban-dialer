/**
 * API Route: Single Lead Operations
 * GET /api/leads/[id] - Get a single lead
 * DELETE /api/leads/[id] - Delete a lead
 * PATCH /api/leads/[id] - Update a lead
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`📖 Fetching lead ${id}...`);

    const lead = await prisma.lead.findUnique({
      where: { id },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found" },
        { status: 404 }
      );
    }

    console.log(`✅ Lead ${id} fetched`);

    return NextResponse.json({
      success: true,
      lead,
    });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log(`🗑️ Deleting lead ${id}...`);

    await prisma.lead.delete({
      where: { id },
    });

    console.log(`✅ Lead ${id} deleted`);

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      {
        error: "Failed to delete lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    console.log(`📝 Updating lead ${id}...`);

    const updateData: any = {
      businessName: body.businessName,
      phone: body.phone || null,
      address: body.address || null,
      category: body.category || null,
      website: body.website || null,
      leadStatus: body.leadStatus || "new",
      notes: body.notes || null,
    };

    // Update lastContactedAt if explicitly provided or if status changed to contacted
    if (body.lastContactedAt) {
      updateData.lastContactedAt = new Date(body.lastContactedAt);
    } else if (body.leadStatus === "contacted") {
      updateData.lastContactedAt = new Date();
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: updateData,
    });

    console.log(`✅ Lead ${id} updated`);

    return NextResponse.json({
      success: true,
      lead: updated,
      message: "Lead updated successfully",
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
