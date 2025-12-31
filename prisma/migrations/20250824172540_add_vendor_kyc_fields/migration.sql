-- CreateEnum
CREATE TYPE "public"."VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."VendorDocType" AS ENUM ('BRN_CERT', 'ID_FRONT', 'ID_BACK', 'BANK_STATEMENT', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Vendor" ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "bankAccountName" TEXT,
ADD COLUMN     "bankAccountNo" TEXT,
ADD COLUMN     "bankBranch" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "bankSwift" TEXT,
ADD COLUMN     "brn" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "kycSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "payoutMethod" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "public"."VendorStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateTable
CREATE TABLE "public"."VendorDocument" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "type" "public"."VendorDocType" NOT NULL,
    "url" TEXT NOT NULL,
    "note" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_active_categoryId_vendorId_idx" ON "public"."Product"("active", "categoryId", "vendorId");

-- CreateIndex
CREATE INDEX "Product_active_priceCents_idx" ON "public"."Product"("active", "priceCents");

-- CreateIndex
CREATE INDEX "Product_active_createdAt_idx" ON "public"."Product"("active", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Vendor" ADD CONSTRAINT "Vendor_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VendorDocument" ADD CONSTRAINT "VendorDocument_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
