/**
 * API Route: Export Leads as CSV
 *
 * GET /api/leads/export - Download all leads as CSV
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    console.log("📥 Exporting all leads as CSV...");

    // Fetch all leads
    const leads = await prisma.lead.findMany({
      orderBy: {
        importedAt: "desc",
      },
    });

    // Create CSV content
    const headers = [
      "place_id",
      "business_name",
      "phone",
      "address",
      "category",
      "rating",
      "review_count",
      "social_only",
      "website",
      "business_status",
      "lead_status",
      "imported_at",
      "last_contacted_at",
      "notes",
    ];

    const rows = leads.map((lead) => [
      lead.placeId || "",
      lead.businessName,
      lead.phone || "",
      lead.address || "",
      lead.category || "",
      lead.rating?.toString() || "",
      lead.reviewCount?.toString() || "",
      lead.socialOnly ? "True" : "False",
      lead.website || "",
      lead.businessStatus || "",
      lead.leadStatus,
      lead.importedAt.toISOString(),
      lead.lastContactedAt?.toISOString() || "",
      lead.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    console.log(`✅ Exported ${leads.length} leads`);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting leads:", error);
    return NextResponse.json(
      {
        error: "Failed to export leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
