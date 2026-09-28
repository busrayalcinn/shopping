-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "campaign" TEXT,
ADD COLUMN     "discountTotal" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "discountQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unitDiscount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReturnItem" ADD COLUMN     "amount" INTEGER NOT NULL DEFAULT 0;

-- Data: önceki iade kalemlerinin tutarı (o zaman indirim yoktu → birim fiyat × adet)
UPDATE "ReturnItem" ri
SET "amount" = oi."price" * ri."qty"
FROM "OrderItem" oi
WHERE ri."orderItemId" = oi."id" AND ri."amount" = 0;
