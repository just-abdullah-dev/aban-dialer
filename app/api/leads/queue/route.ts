/**
 * API Route: Leads Queue for Dialer
 *
 * GET /api/leads/queue - Fetch all leads with categories and counts for queue view
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category") || "";
    const leadStatus = searchParams.get("leadStatus") || "";

    // Build where clause
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (leadStatus) {
      where.leadStatus = leadStatus;
    }

    console.log(`📊 Fetching leads queue (category: ${category || "all"}, status: ${leadStatus || "all"})`);

    // Fetch all filtered leads (no pagination - we need all for queue navigation)
    const leads = await prisma.lead.findMany({
      where,
      orderBy: {
        importedAt: "desc",
      },
      select: {
        id: true,
        placeId: true,
        businessName: true,
        phone: true,
        address: true,
        category: true,
        rating: true,
        reviewCount: true,
        socialOnly: true,
        website: true,
        leadStatus: true,
        notes: true,
        lastContactedAt: true,
      },
    });

    // Get all unique categories with counts per status
    const categoriesRaw = await prisma.lead.groupBy({
      by: ["category", "leadStatus"],
      _count: {
        category: true,
      },
      where: leadStatus ? { leadStatus } : {},
    });

    // Transform to category -> count map
    const categoryCountsMap = new Map<string, number>();
    categoriesRaw.forEach((item) => {
      const cat = item.category || "Uncategorized";
      const currentCount = categoryCountsMap.get(cat) || 0;
      categoryCountsMap.set(cat, currentCount + item._count.category);
    });

    // Convert to array format
    const categories = Array.from(categoryCountsMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending

    // Get status counts (considering category filter)
    const statusCountsRaw = await prisma.lead.groupBy({
      by: ["leadStatus"],
      _count: {
        leadStatus: true,
      },
      where: category ? { category } : {},
    });

    const statusCounts: Record<string, number> = {};
    statusCountsRaw.forEach((item) => {
      statusCounts[item.leadStatus] = item._count.leadStatus;
    });

    // Get total count
    const total = await prisma.lead.count({ where: {} });

    console.log(`✅ Fetched ${leads.length} leads, ${categories.length} categories`);

    return NextResponse.json({
      success: true,
      leads,
      categories,
      statusCounts,
      total,
    });
  } catch (error) {
    console.error("Error fetching leads queue:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leads queue",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
