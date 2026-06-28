/**
 * GET /api/contacts/[id] - Get single contact
 * PATCH /api/contacts/[id] - Update contact
 * DELETE /api/contacts/[id] - Delete contact
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { isValidE164, formatToE164 } from "@/lib/utils/phone";

/**
 * GET /api/contacts/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        calls: {
          orderBy: { createdAt: "desc" },
          take: 10, // Last 10 calls
          include: {
            disposition: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();
    const { businessName, contactName, phoneE164, country, notes, nextCallbackAt } = body;

    // Check if contact exists
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Validate phone number if provided
    let validatedPhone = phoneE164;
    if (phoneE164) {
      if (!isValidE164(phoneE164)) {
        const formatted = formatToE164(phoneE164, country || existing.country);
        if (!formatted) {
          return NextResponse.json(
            { error: "Invalid phone number format. Use E.164 format (e.g., +14155551234)" },
            { status: 400 }
          );
        }
        validatedPhone = formatted;
      }

      // Check if phone number is already used by another contact
      if (validatedPhone !== existing.phoneE164) {
        const duplicate = await prisma.contact.findFirst({
          where: {
            phoneE164: validatedPhone,
            id: { not: id },
          },
        });

        if (duplicate) {
          return NextResponse.json(
            { error: "This phone number is already used by another contact" },
            { status: 409 }
          );
        }
      }
    }

    // Build update data
    const updateData: any = {};

    if (businessName !== undefined) updateData.businessName = businessName.trim();
    if (contactName !== undefined) updateData.contactName = contactName?.trim() || null;
    if (validatedPhone) updateData.phoneE164 = validatedPhone;
    if (country) updateData.country = country;
    if (notes !== undefined) updateData.notes = notes?.trim() || null;
    if (nextCallbackAt !== undefined) {
      updateData.nextCallbackAt = nextCallbackAt ? new Date(nextCallbackAt) : null;
    }

    // Update contact
    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const { id } = await params;

    // Check if contact exists
    const existing = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Delete contact (cascade will handle related calls)
    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
