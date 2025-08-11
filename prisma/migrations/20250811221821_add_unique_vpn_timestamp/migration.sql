/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `VPN` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."VPN" DROP COLUMN "expiresAt",
ADD COLUMN     "expiredAt" TIMESTAMP(6),
ADD COLUMN     "planId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."VPN" ADD CONSTRAINT "VPN_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
