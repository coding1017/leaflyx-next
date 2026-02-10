import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from "fs";

async function main() {
  const prisma = new PrismaClient();
  const payload = {
    users: await prisma.user.findMany(),
    accounts: await prisma.account.findMany(),
    sessions: await prisma.session.findMany(),
    verificationTokens: await prisma.verificationToken.findMany(),

    discountCodes: await prisma.discountCode.findMany(),
    discountRedemptions: await prisma.discountRedemption.findMany(),

    reviews: await prisma.review.findMany(),
    reviewFlags: await prisma.reviewFlag.findMany(),

    inventory: await prisma.inventory.findMany(),
    backInStock: await prisma.backInStockRequest.findMany(),

    orders: await prisma.order.findMany(),
    orderItems: await prisma.orderItem.findMany(),

    resetTokens: await prisma.passwordResetToken.findMany(),
    subscribers: await prisma.subscriber.findMany(),
  };

  fs.writeFileSync("scripts/sqlite-export.json", JSON.stringify(payload, null, 2));
  console.log("✅ Exported to scripts/sqlite-export.json");
  console.log(Object.fromEntries(Object.entries(payload).map(([k, v]) => [k, (v as any[]).length])));
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
