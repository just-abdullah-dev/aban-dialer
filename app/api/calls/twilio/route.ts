/**
 * API Route: Twilio Call History
 *
 * GET /api/calls/twilio
 * Fetches call history directly from Twilio API
 */

import { NextRequest, NextResponse } from "next/server";
import { getTelephonyProvider } from "@/lib/telephony/factory";
import twilio from "twilio";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Initialize Twilio client
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    const client = twilio(accountSid, authToken);

    // Build query options
    const options: any = {
      pageSize: limit,
    };

    if (status) {
      options.status = status;
    }

    if (dateFrom) {
      options.startTimeAfter = new Date(dateFrom);
    }

    if (dateTo) {
      options.startTimeBefore = new Date(dateTo);
    }

    // Fetch calls from Twilio
    console.log(`📞 Fetching Twilio call history (page ${page}, limit ${limit})`);

    const calls = await client.calls.list(options);

    // Format the response
    const formattedCalls = calls.map((call) => ({
      id: call.sid,
      sid: call.sid,
      from: call.from,
      to: call.to,
      status: call.status,
      direction: call.direction,
      duration: call.duration,
      price: call.price,
      priceUnit: call.priceUnit,
      startTime: call.startTime,
      endTime: call.endTime,
      answeredBy: call.answeredBy,
      forwardedFrom: call.forwardedFrom,
      callerName: call.callerName,
      uri: call.uri,
      // Twilio-specific fields
      dateCreated: call.dateCreated,
      dateUpdated: call.dateUpdated,
      parentCallSid: call.parentCallSid,
      phoneNumberSid: call.phoneNumberSid,
    }));

    // Pagination info
    const totalCalls = formattedCalls.length;
    const hasMore = totalCalls === limit; // If we got full page, there might be more

    console.log(`✅ Fetched ${formattedCalls.length} calls from Twilio`);

    return NextResponse.json({
      success: true,
      source: "twilio",
      calls: formattedCalls,
      pagination: {
        page,
        limit,
        total: totalCalls,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching Twilio call history:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch call history from Twilio",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
