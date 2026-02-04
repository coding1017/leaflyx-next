-- CreateTable
CREATE TABLE "ReviewFlag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reviewId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewFlag_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Review" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productSlug" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "ipHash" TEXT,
    "userAgent" TEXT
);
INSERT INTO "new_Review" ("authorName", "body", "createdAt", "helpfulCount", "id", "productSlug", "rating", "title", "verifiedPurchase") SELECT "authorName", "body", "createdAt", "helpfulCount", "id", "productSlug", "rating", "title", "verifiedPurchase" FROM "Review";
DROP TABLE "Review";
ALTER TABLE "new_Review" RENAME TO "Review";
CREATE INDEX "Review_productSlug_idx" ON "Review"("productSlug");
CREATE INDEX "Review_productSlug_createdAt_idx" ON "Review"("productSlug", "createdAt");
CREATE INDEX "Review_productSlug_rating_idx" ON "Review"("productSlug", "rating");
CREATE INDEX "Review_productSlug_helpfulCount_idx" ON "Review"("productSlug", "helpfulCount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "ReviewFlag_reviewId_idx" ON "ReviewFlag"("reviewId");
