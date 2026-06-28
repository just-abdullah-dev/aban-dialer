/**
 * Analytics API
 * GET /api/analytics - Fetch call analytics and statistics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "7d";

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (range) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Fetch calls in range
    const calls = await prisma.call.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      include: {
        disposition: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate metrics
    const totalCalls = calls.length;
    const answeredCalls = calls.filter((c) => c.status === "completed").length;
    const missedCalls = calls.filter((c) => ["no-answer", "busy", "failed"].includes(c.status)).length;

    const completedCalls = calls.filter((c) => c.status === "completed" && c.durationSeconds);
    const avgDuration = completedCalls.length > 0
      ? Math.round(completedCalls.reduce((sum, c) => sum + (c.durationSeconds || 0), 0) / completedCalls.length)
      : 0;

    // Disposition breakdown
    const dispositionBreakdown: Record<string, number> = {};
    calls.forEach((call) => {
      if (call.disposition) {
        const outcome = call.disposition.outcome;
        dispositionBreakdown[outcome] = (dispositionBreakdown[outcome] || 0) + 1;
      }
    });

    // Calls by day
    const callsByDay: Array<{ date: string; count: number }> = [];
    const dayMap = new Map<string, number>();

    calls.forEach((call) => {
      const dateKey = call.createdAt.toISOString().split("T")[0];
      dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1);
    });

    // Fill in all days in range
    const currentDate = new Date(startDate);
    while (currentDate <= now) {
      const dateKey = currentDate.toISOString().split("T")[0];
      callsByDay.push({
        date: dateKey,
        count: dayMap.get(dateKey) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calls by hour (0-23)
    const callsByHour: Array<{ hour: number; count: number }> = [];
    const hourMap = new Map<number, number>();

    calls.forEach((call) => {
      const hour = call.createdAt.getHours();
      hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
    });

    for (let hour = 0; hour < 24; hour++) {
      callsByHour.push({
        hour,
        count: hourMap.get(hour) || 0,
      });
    }

    return NextResponse.json({
      totalCalls,
      answeredCalls,
      missedCalls,
      avgDuration,
      dispositionBreakdown,
      callsByDay,
      callsByHour,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
