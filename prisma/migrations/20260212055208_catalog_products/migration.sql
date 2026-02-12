-- CreateTable
CREATE TABLE "CatalogProduct" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategories" JSONB,
    "tags" JSONB,
    "price" DOUBLE PRECISION,
    "potency" TEXT,
    "badge" TEXT,
    "coaUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "imageUrls" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CatalogVariant" (
    "productId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "label" TEXT,
    "grams" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CatalogVariant_pkey" PRIMARY KEY ("productId","id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogProduct_slug_key" ON "CatalogProduct"("slug");

-- CreateIndex
CREATE INDEX "CatalogVariant_productId_idx" ON "CatalogVariant"("productId");

-- AddForeignKey
ALTER TABLE "CatalogVariant" ADD CONSTRAINT "CatalogVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "CatalogProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
