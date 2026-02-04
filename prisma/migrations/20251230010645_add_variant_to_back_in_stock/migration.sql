/*
  Warnings:

  - A unique constraint covering the columns `[productId,variant,email]` on the table `BackInStockRequest` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "BackInStockRequest_productId_email_key";

-- AlterTable
ALTER TABLE "BackInStockRequest" ADD COLUMN "variant" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BackInStockRequest_productId_variant_email_key" ON "BackInStockRequest"("productId", "variant", "email");
