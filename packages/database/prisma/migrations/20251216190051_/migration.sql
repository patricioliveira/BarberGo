/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Barbershop` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Barbershop` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Barbershop" ADD COLUMN     "isExclusive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Barbershop_slug_key" ON "Barbershop"("slug");
