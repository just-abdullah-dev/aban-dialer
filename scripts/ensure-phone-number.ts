/**
 * Ensure Phone Number in Database
 *
 * This script checks if the Twilio phone number exists in the database,
 * and adds it if it doesn't exist.
 */

import { prisma } from "../lib/db/client";

async function main() {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER;
  const accountSid = process.env.TWILIO_ACCOUNT_SID;

  if (!phoneNumber) {
    console.error("❌ TWILIO_PHONE_NUMBER not found in environment variables");
    process.exit(1);
  }

  console.log(`🔍 Checking for phone number: ${phoneNumber}`);

  // Check if number already exists
  const existing = await prisma.number.findFirst({
    where: { e164Number: phoneNumber },
  });

  if (existing) {
    console.log(`✅ Phone number already exists in database (ID: ${existing.id})`);
    console.log(`   Provider: ${existing.providerName}`);
    console.log(`   Active: ${existing.isActive}`);
    return;
  }

  // Add the number
  console.log("📝 Adding phone number to database...");

  const newNumber = await prisma.number.create({
    data: {
      e164Number: phoneNumber,
      country: phoneNumber.startsWith("+1") ? "US" : "AU",
      providerName: "twilio",
      providerNumberSid: accountSid || "system",
      isActive: true,
    },
  });

  console.log(`✅ Phone number added successfully (ID: ${newNumber.id})`);
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
