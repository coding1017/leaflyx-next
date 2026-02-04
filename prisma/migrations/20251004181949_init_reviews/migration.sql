-- CreateTable
CREATE TABLE "Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productSlug" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Review_productSlug_idx" ON "Review"("productSlug");

-- CreateIndex
CREATE INDEX "Review_productSlug_createdAt_idx" ON "Review"("productSlug", "createdAt");

-- CreateIndex
CREATE INDEX "Review_productSlug_rating_idx" ON "Review"("productSlug", "rating");

-- CreateIndex
CREATE INDEX "Review_productSlug_helpfulCount_idx" ON "Review"("productSlug", "helpfulCount");
