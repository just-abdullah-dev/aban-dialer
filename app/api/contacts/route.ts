/**
 * GET /api/contacts - List all contacts with optional filters
 * POST /api/contacts - Create a new contact
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { isValidE164, formatToE164 } from "@/lib/utils/phone";

/**
 * GET /api/contacts
 * Query params: search, country, source, limit, offset
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const country = searchParams.get("country");
    const source = searchParams.get("source");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { phoneE164: { contains: search } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    if (country) {
      where.country = country;
    }

    if (source) {
      where.source = source;
    }

    // Fetch contacts with pagination
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        include: {
          calls: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 1, // Latest call only
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + contacts.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts
 * Body: { businessName, contactName?, phoneE164, country, notes? }
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { businessName, contactName, phoneE164, country, notes } = body;

    // Validate required fields
    if (!businessName || !phoneE164 || !country) {
      return NextResponse.json(
        { error: "businessName, phoneE164, and country are required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    let validatedPhone = phoneE164;

    // Try to format to E.164 if not already
    if (!isValidE164(phoneE164)) {
      const formatted = formatToE164(phoneE164, country);
      if (!formatted) {
        return NextResponse.json(
          { error: "Invalid phone number format. Use E.164 format (e.g., +14155551234)" },
          { status: 400 }
        );
      }
      validatedPhone = formatted;
    }

    // Check if contact with this phone already exists
    const existing = await prisma.contact.findFirst({
      where: { phoneE164: validatedPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A contact with this phone number already exists" },
        { status: 409 }
      );
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        businessName: businessName.trim(),
        contactName: contactName?.trim() || null,
        phoneE164: validatedPhone,
        country,
        source: "manual",
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
