/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `PromoCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_email_key" ON "PromoCode"("email");
