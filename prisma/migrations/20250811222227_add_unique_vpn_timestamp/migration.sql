/*
  Warnings:

  - A unique constraint covering the columns `[vpnId,timestamp]` on the table `Traffic` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Traffic_vpnId_timestamp_key" ON "public"."Traffic"("vpnId", "timestamp");
