/**
 * Database Seed Script
 *
 * Creates sample data for development and testing:
 * - Test user account
 * - Sample phone numbers
 * - Sample contacts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create test user (email: admin@abandialer.com, password: admin123)
  const passwordHash = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@abandialer.com" },
    update: {},
    create: {
      email: "admin@abandialer.com",
      passwordHash,
    },
  });
  console.log("✅ Created test user:", user.email);

  // Create sample phone numbers (will be replaced with real ones later)
  const usNumber = await prisma.number.upsert({
    where: { e164Number: "+15551234567" },
    update: {},
    create: {
      e164Number: "+15551234567",
      country: "US",
      providerName: "twilio",
      providerNumberSid: "PN_sample_us_number",
      isActive: true,
    },
  });
  console.log("✅ Created US number:", usNumber.e164Number);

  const auNumber = await prisma.number.upsert({
    where: { e164Number: "+61512345678" },
    update: {},
    create: {
      e164Number: "+61512345678",
      country: "AU",
      providerName: "twilio",
      providerNumberSid: "PN_sample_au_number",
      isActive: true,
    },
  });
  console.log("✅ Created AU number:", auNumber.e164Number);

  // Create sample contacts
  const contacts = [
    {
      businessName: "Joe's Pizza",
      contactName: "Joe Smith",
      phoneE164: "+15559871234",
      country: "US",
      source: "manual",
      notes: "Small pizza shop, no website yet",
    },
    {
      businessName: "Smith's Auto Repair",
      contactName: "Sarah Smith",
      phoneE164: "+15559872345",
      country: "US",
      source: "manual",
      notes: "Family-owned auto shop",
    },
    {
      businessName: "Melbourne Plumbing Co",
      contactName: "Mike Johnson",
      phoneE164: "+61398765432",
      country: "AU",
      source: "manual",
      notes: "Plumbing services in Melbourne",
    },
    {
      businessName: "Sydney Bakery",
      contactName: null,
      phoneE164: "+61298761234",
      country: "AU",
      source: "csv-import",
      notes: "Local bakery in Sydney CBD",
    },
    {
      businessName: "Tech Repair Shop",
      contactName: "Lisa Wong",
      phoneE164: "+15559873456",
      country: "US",
      source: "manual",
      notes: "Computer repair, interested in web presence",
    },
  ];

  for (const contact of contacts) {
    // Check if contact already exists
    const existing = await prisma.contact.findFirst({
      where: { phoneE164: contact.phoneE164 },
    });

    if (!existing) {
      const created = await prisma.contact.create({
        data: contact,
      });
      console.log(`✅ Created contact: ${created.businessName}`);
    } else {
      console.log(`⏭️  Contact already exists: ${existing.businessName}`);
    }
  }

  console.log("🎉 Database seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
