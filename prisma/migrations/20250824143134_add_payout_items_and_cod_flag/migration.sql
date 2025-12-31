-- AlterTable
ALTER TABLE "public"."VendorOrder" ADD COLUMN     "codCommissionSettledAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."PayoutItem" (
    "id" TEXT NOT NULL,
    "payoutId" TEXT NOT NULL,
    "vendorOrderId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PayoutItem_vendorOrderId_payoutId_key" ON "public"."PayoutItem"("vendorOrderId", "payoutId");

-- AddForeignKey
ALTER TABLE "public"."PayoutItem" ADD CONSTRAINT "PayoutItem_payoutId_fkey" FOREIGN KEY ("payoutId") REFERENCES "public"."Payout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PayoutItem" ADD CONSTRAINT "PayoutItem_vendorOrderId_fkey" FOREIGN KEY ("vendorOrderId") REFERENCES "public"."VendorOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
