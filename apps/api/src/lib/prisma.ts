import { PrismaClient } from "@prisma/client";

declare global {
  var __deolyPrisma: PrismaClient | undefined;
}

export const prisma = globalThis.__deolyPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.__deolyPrisma = prisma;
}
