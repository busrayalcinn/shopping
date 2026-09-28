-- CreateTable
CREATE TABLE "ProductColor" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProductColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductColor_productId_name_key" ON "ProductColor"("productId", "name");

-- CreateIndex
CREATE INDEX "ProductColor_productId_idx" ON "ProductColor"("productId");

-- AddForeignKey
ALTER TABLE "ProductColor" ADD CONSTRAINT "ProductColor_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data: her mevcut ürüne, mevcut fotoğrafıyla bir varsayılan renk
INSERT INTO "ProductColor" ("productId", "name", "hex", "imageUrl", "position")
SELECT "id", 'Standart', '#d6d3d1', "imageUrl", 0 FROM "Product";

-- AlterTable: stok satırlarını varsayılan renge bağla
ALTER TABLE "ProductVariant" ADD COLUMN "colorId" INTEGER;

UPDATE "ProductVariant" v
SET "colorId" = c."id"
FROM "ProductColor" c
WHERE c."productId" = v."productId";

ALTER TABLE "ProductVariant" ALTER COLUMN "colorId" SET NOT NULL;

-- DropIndex
DROP INDEX "ProductVariant_productId_size_key";

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_colorId_size_key" ON "ProductVariant"("colorId", "size");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ProductColor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "colorId" INTEGER,
ADD COLUMN "colorName" TEXT;
