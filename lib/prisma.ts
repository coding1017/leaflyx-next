// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Reuse a single PrismaClient in dev to avoid "Too many clients" during HMR.
 * Uses one shared instance in dev, and a new instance in prod.
 */
export const prisma =
  global.prisma ??
  new PrismaClient({
    log: ["warn", "error"], // change to ["query","info","warn","error"] if you want verbose logs
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
