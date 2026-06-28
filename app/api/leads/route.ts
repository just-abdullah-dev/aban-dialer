/**
 * API Route: Leads Management
 *
 * GET /api/leads - Fetch leads with pagination and filters
 * POST /api/leads - Save imported leads to database
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const socialOnly = searchParams.get("socialOnly") || "";
    const leadStatus = searchParams.get("leadStatus") || "";
    const businessStatus = searchParams.get("businessStatus") || "";
    const minRating = searchParams.get("minRating") || "";
    const maxRating = searchParams.get("maxRating") || "";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (socialOnly) {
      where.socialOnly = socialOnly === "true";
    }

    if (leadStatus) {
      where.leadStatus = leadStatus;
    }

    if (businessStatus) {
      where.businessStatus = businessStatus;
    }

    if (minRating || maxRating) {
      where.rating = {};
      if (minRating) where.rating.gte = parseFloat(minRating);
      if (maxRating) where.rating.lte = parseFloat(maxRating);
    }

    console.log(`📊 Fetching leads (page ${page}, limit ${limit})`);

    // Get total count
    const total = await prisma.lead.count({ where });

    // Get paginated leads
    const leads = await prisma.lead.findMany({
      where,
      orderBy: {
        importedAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    console.log(`✅ Fetched ${leads.length} leads (${total} total)`);

    return NextResponse.json({
      success: true,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leads } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "No leads provided" },
        { status: 400 }
      );
    }

    console.log(`💾 Starting bulk insert of ${leads.length} leads...`);

    // Use a single database transaction for all operations
    const result = await prisma.$transaction(
      async (tx) => {
        // Process all leads
        const processedLeads = leads.map((lead: any) => ({
          placeId: lead.place_id || null,
          businessName: lead.business_name || "N/A",
          phone: lead.phone ? String(lead.phone).trim() : null,
          address: lead.address || null,
          category: lead.category || null,
          rating: lead.rating ? parseFloat(lead.rating) : null,
          reviewCount: lead.review_count ? parseInt(lead.review_count) : null,
          socialOnly: lead.social_only === "True" || lead.social_only === true,
          website: lead.website || null,
          businessStatus: lead.business_status || "N/A",
          leadStatus: "new",
        }));

        // Check for duplicates in database (by phone)
        const phonesToCheck = processedLeads
          .map((l) => l.phone)
          .filter((p): p is string => p !== null && p !== "");

        const existingLeads = await tx.lead.findMany({
          where: {
            phone: {
              in: phonesToCheck,
            },
          },
          select: {
            phone: true,
            businessName: true,
          },
        });

        // Create a map for quick lookup
        const existingPhoneMap = new Map(
          existingLeads.map((l) => [l.phone, l.businessName])
        );

        // Separate new leads and duplicates
        const newLeads: typeof processedLeads = [];
        const skippedLeads: Array<{
          businessName: string;
          phone: string;
          existingBusinessName: string;
        }> = [];

        processedLeads.forEach((lead) => {
          if (lead.phone && existingPhoneMap.has(lead.phone)) {
            // This is a duplicate - skip it
            skippedLeads.push({
              businessName: lead.businessName,
              phone: lead.phone,
              existingBusinessName: existingPhoneMap.get(lead.phone) || "Unknown",
            });
          } else {
            // This is new - include it
            newLeads.push(lead);
          }
        });

        if (newLeads.length === 0) {
          return {
            saved: 0,
            duplicates: processedLeads.length,
            skippedLeads,
            message: "All leads already exist in database. No new leads saved.",
          };
        }

        // Bulk insert all new leads in a single query
        const inserted = await tx.lead.createMany({
          data: newLeads,
          skipDuplicates: true, // Extra safety
        });

        const duplicateCount = processedLeads.length - inserted.count;

        console.log(
          `✅ Bulk insert completed: ${inserted.count} new leads, ${duplicateCount} duplicates skipped`
        );

        return {
          saved: inserted.count,
          duplicates: duplicateCount,
          skippedLeads,
          message: `Saved ${inserted.count} new leads${
            duplicateCount > 0
              ? `, ${duplicateCount} duplicates skipped (already in database)`
              : ""
          }`,
        };
      },
      {
        maxWait: 30000, // Maximum time to wait for transaction to start (30 seconds)
        timeout: 60000, // Maximum time transaction can run (60 seconds)
      }
    );

    return NextResponse.json({
      success: true,
      message: result.message,
      saved: result.saved,
      duplicates: result.duplicates,
      skippedLeads: result.skippedLeads,
    });
  } catch (error) {
    console.error("Error saving leads:", error);
    return NextResponse.json(
      {
        error: "Failed to save leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
