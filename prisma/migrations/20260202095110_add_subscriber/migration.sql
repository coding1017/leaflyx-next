/*
  Warnings:

  - You are about to drop the column `lastSubscribedAt` on the `Subscriber` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Subscriber` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Subscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT,
    "tags" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "unsubscribedAt" DATETIME
);
INSERT INTO "new_Subscriber" ("createdAt", "email", "id", "source", "status", "tags", "token", "unsubscribedAt") SELECT "createdAt", "email", "id", "source", "status", "tags", "token", "unsubscribedAt" FROM "Subscriber";
DROP TABLE "Subscriber";
ALTER TABLE "new_Subscriber" RENAME TO "Subscriber";
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");
CREATE UNIQUE INDEX "Subscriber_token_key" ON "Subscriber"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
