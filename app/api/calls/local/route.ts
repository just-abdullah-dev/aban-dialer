/**
 * API Route: Local Call History with Dispositions
 *
 * GET /api/calls/local
 * Fetches calls from local database with disposition data
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const disposition = searchParams.get("disposition") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { toNumber: { contains: search } },
        { contact: { businessName: { contains: search } } },
        { contact: { contactName: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (disposition) {
      where.disposition = {
        outcome: disposition,
      };
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    console.log(`💾 Fetching local call history (page ${page}, limit ${limit})`);

    // Get total count
    const total = await prisma.call.count({ where });

    // Get paginated calls
    const calls = await prisma.call.findMany({
      where,
      include: {
        contact: {
          select: {
            businessName: true,
            contactName: true,
            phoneE164: true,
          },
        },
        disposition: {
          select: {
            outcome: true,
            notes: true,
            createdAt: true,
          },
        },
        fromNumber: {
          select: {
            e164Number: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate pagination
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;

    console.log(`✅ Fetched ${calls.length} calls from local database (${total} total)`);

    return NextResponse.json({
      success: true,
      source: "local",
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching local call history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch call history from database",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
