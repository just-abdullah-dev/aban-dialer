/**
 * Database Client Wrapper
 *
 * Provides a singleton Prisma Client instance for the application.
 * Uses connection pooling and proper cleanup in development.
 */

import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to the `global` object in development
// to prevent exhausting database connections due to hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}
