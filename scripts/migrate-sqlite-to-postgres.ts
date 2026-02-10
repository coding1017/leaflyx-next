/* scripts/migrate-sqlite-to-postgres.ts */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

/**
 * ✅ IMPORTANT:
 * dotenv/config does NOT reliably load .env.local.
 * We explicitly load .env.local first, then .env.
 */
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local", override: true });
if (fs.existsSync(".env")) dotenv.config({ path: ".env", override: false });

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function maskUrl(u: string) {
  return u.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
}

async function main() {
  const EXPORT_PATH = process.env.SQLITE_EXPORT_PATH ?? "scripts/sqlite-export.json";
  const full = path.resolve(EXPORT_PATH);

  if (!fs.existsSync(full)) {
    throw new Error(
      `Missing export file: ${full}. Run:\n` +
        `SQLITE_DATABASE_URL="file:$(pwd)/prisma/dev.db" npx ts-node scripts/export-sqlite.ts`
    );
  }

  const raw = fs.readFileSync(full, "utf8");
  const data = JSON.parse(raw);

  const POSTGRES_URL =
    process.env.APP_DIRECT_URL ||
    process.env.APP_DATABASE_URL ||
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL;

  if (!POSTGRES_URL) {
    throw new Error(
      "Missing Postgres env var. Put APP_DIRECT_URL or APP_DATABASE_URL in .env.local (recommended)."
    );
  }
  if (!/^postgres(ql)?:\/\//.test(POSTGRES_URL)) {
    throw new Error(
      `Postgres URL must start with postgres:// or postgresql://.\nGot: ${POSTGRES_URL}`
    );
  }

  console.log("Export:", full);
  console.log("Postgres:", maskUrl(POSTGRES_URL));

  const pg = new PrismaClient({ datasources: { db: { url: POSTGRES_URL } } });

  // Ensure arrays
  const users = data.users ?? [];
  const accounts = data.accounts ?? [];
  const sessions = data.sessions ?? [];
  const verificationTokens = data.verificationTokens ?? [];

  const discountCodes = data.discountCodes ?? [];
  const discountRedemptions = data.discountRedemptions ?? [];

  const orders = data.orders ?? [];
  const orderItems = data.orderItems ?? [];

  const reviews = data.reviews ?? [];
  const reviewFlags = data.reviewFlags ?? [];

  const inventory = data.inventory ?? [];
  const backInStock = data.backInStock ?? [];

  const resetTokens = data.resetTokens ?? [];
  const subscribers = data.subscribers ?? [];

  console.log("Counts:", {
    users: users.length,
    accounts: accounts.length,
    sessions: sessions.length,
    verificationTokens: verificationTokens.length,
    discountCodes: discountCodes.length,
    discountRedemptions: discountRedemptions.length,
    orders: orders.length,
    orderItems: orderItems.length,
    reviews: reviews.length,
    reviewFlags: reviewFlags.length,
    inventory: inventory.length,
    backInStock: backInStock.length,
    resetTokens: resetTokens.length,
    subscribers: subscribers.length,
  });

  // Some Prisma Client typings can be "weird" under ts-node depending on config.
  // This keeps the script unblocked.
  const db: any = pg;

  try {
    // ✅ CLEAR existing Postgres data (FK-safe order)
    await db.reviewFlag.deleteMany();
    await db.review.deleteMany();

    await db.discountRedemption.deleteMany();
    await db.discountCode.deleteMany();

    await db.orderItem.deleteMany();
    await db.order.deleteMany();

    await db.backInStockRequest.deleteMany();
    await db.inventory.deleteMany();

    await db.passwordResetToken.deleteMany();
    await db.subscriber.deleteMany();

    await db.session.deleteMany();
    await db.account.deleteMany();
    await db.verificationToken.deleteMany();
    await db.user.deleteMany();

    // ✅ IMPORT (no skipDuplicates)
    for (const batch of chunk(users, 500)) {
      await db.user.createMany({ data: batch });
    }
    for (const batch of chunk(accounts, 500)) {
      await db.account.createMany({ data: batch });
    }
    for (const batch of chunk(sessions, 500)) {
      await db.session.createMany({ data: batch });
    }
    for (const batch of chunk(verificationTokens, 500)) {
      await db.verificationToken.createMany({ data: batch });
    }

    for (const batch of chunk(discountCodes, 500)) {
      await db.discountCode.createMany({ data: batch });
    }
    for (const batch of chunk(discountRedemptions, 500)) {
      await db.discountRedemption.createMany({ data: batch });
    }

    for (const batch of chunk(orders, 500)) {
      await db.order.createMany({ data: batch });
    }
    for (const batch of chunk(orderItems, 500)) {
      await db.orderItem.createMany({ data: batch });
    }

    for (const batch of chunk(reviews, 500)) {
      await db.review.createMany({ data: batch });
    }
    for (const batch of chunk(reviewFlags, 500)) {
      await db.reviewFlag.createMany({ data: batch });
    }

    for (const batch of chunk(inventory, 500)) {
      await db.inventory.createMany({ data: batch });
    }
    for (const batch of chunk(backInStock, 500)) {
      await db.backInStockRequest.createMany({ data: batch });
    }

    for (const batch of chunk(resetTokens, 500)) {
      await db.passwordResetToken.createMany({ data: batch });
    }
    for (const batch of chunk(subscribers, 500)) {
      await db.subscriber.createMany({ data: batch });
    }

    // ✅ Fix sequences for autoincrement Int IDs
    await pg.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Review"', 'id'),
        COALESCE((SELECT MAX(id) FROM "Review"), 1));
    `);

    await pg.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"ReviewFlag"', 'id'),
        COALESCE((SELECT MAX(id) FROM "ReviewFlag"), 1));
    `);

    console.log("✅ Import complete");
  } finally {
    await pg.$disconnect();
  }
}

main().catch((e) => {
  console.error("❌ Migration failed:", e);
  process.exit(1);
});
