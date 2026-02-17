-- CreateIndex
CREATE INDEX "CatalogProduct_category_idx" ON "CatalogProduct"("category");

-- CreateIndex
CREATE INDEX "CatalogProduct_active_idx" ON "CatalogProduct"("active");

-- CreateIndex
CREATE INDEX "Inventory_productId_idx" ON "Inventory"("productId");

-- CreateIndex
CREATE INDEX "Inventory_productId_variant_idx" ON "Inventory"("productId", "variant");
