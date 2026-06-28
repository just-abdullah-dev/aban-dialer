/**
 * POST /api/contacts/import
 *
 * Bulk import contacts from CSV
 * Expected CSV columns: businessName, contactName, phone, country, notes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAuth } from "@/lib/auth/session";
import { isValidE164, formatToE164 } from "@/lib/utils/phone";
import Papa from "papaparse";

interface CSVRow {
  businessName?: string;
  contactName?: string;
  phone?: string;
  country?: string;
  notes?: string;
}

interface ImportResult {
  success: number;
  skipped: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.response) return auth.response;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    // Read file contents
    const text = await file.text();

    // Parse CSV
    const parseResult = Papa.parse<CSVRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => {
        // Normalize header names
        const normalized = header.trim().toLowerCase();
        if (normalized.includes("business")) return "businessName";
        if (normalized.includes("contact")) return "contactName";
        if (normalized.includes("phone") || normalized.includes("number")) return "phone";
        if (normalized.includes("country")) return "country";
        if (normalized.includes("note")) return "notes";
        return header;
      },
    });

    if (parseResult.errors.length > 0) {
      return NextResponse.json(
        { error: "Failed to parse CSV", details: parseResult.errors },
        { status: 400 }
      );
    }

    const rows = parseResult.data;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV file is empty" },
        { status: 400 }
      );
    }

    // Process rows
    const result: ImportResult = {
      success: 0,
      skipped: 0,
      errors: [],
    };

    const existingPhones = new Set(
      (await prisma.contact.findMany({ select: { phoneE164: true } })).map(
        (c) => c.phoneE164
      )
    );

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because CSV is 1-indexed and has header

      try {
        // Validate required fields
        if (!row.businessName || !row.phone || !row.country) {
          result.errors.push({
            row: rowNumber,
            error: "Missing required fields (businessName, phone, country)",
            data: row,
          });
          result.skipped++;
          continue;
        }

        // Format phone number
        let validatedPhone = row.phone.trim();
        if (!isValidE164(validatedPhone)) {
          const formatted = formatToE164(validatedPhone, row.country);
          if (!formatted) {
            result.errors.push({
              row: rowNumber,
              error: `Invalid phone number: ${row.phone}`,
              data: row,
            });
            result.skipped++;
            continue;
          }
          validatedPhone = formatted;
        }

        // Check for duplicates (in DB and in current batch)
        if (existingPhones.has(validatedPhone)) {
          result.errors.push({
            row: rowNumber,
            error: "Phone number already exists",
            data: row,
          });
          result.skipped++;
          continue;
        }

        // Create contact
        await prisma.contact.create({
          data: {
            businessName: row.businessName.trim(),
            contactName: row.contactName?.trim() || null,
            phoneE164: validatedPhone,
            country: row.country.trim(),
            source: "csv-import",
            notes: row.notes?.trim() || null,
          },
        });

        // Add to existing set to prevent duplicates within the same import
        existingPhones.add(validatedPhone);
        result.success++;
      } catch (error) {
        console.error(`Error importing row ${rowNumber}:`, error);
        result.errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : "Unknown error",
          data: row,
        });
        result.skipped++;
      }
    }

    return NextResponse.json({
      message: `Import completed: ${result.success} contacts created, ${result.skipped} skipped`,
      result,
    });
  } catch (error) {
    console.error("Error importing contacts:", error);
    return NextResponse.json(
      { error: "Failed to import contacts" },
      { status: 500 }
    );
  }
}
