-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "referralRewardSourceId" TEXT;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_referralRewardSourceId_fkey" FOREIGN KEY ("referralRewardSourceId") REFERENCES "Barbershop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
