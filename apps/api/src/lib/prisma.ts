import { PrismaClient } from "@prisma/client";

declare global {
  var __sanctuaryPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__sanctuaryPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__sanctuaryPrisma = prisma;
}
