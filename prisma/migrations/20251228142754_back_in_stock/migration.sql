-- CreateTable
CREATE TABLE "BackInStockRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "BackInStockRequest_productId_email_key" ON "BackInStockRequest"("productId", "email");
