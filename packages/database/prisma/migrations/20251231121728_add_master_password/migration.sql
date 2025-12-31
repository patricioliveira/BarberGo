-- AlterTable
ALTER TABLE "User" ADD COLUMN     "masterPassword" TEXT,
ADD COLUMN     "masterPasswordExpiresAt" TIMESTAMP(3);
