-- CreateEnum
CREATE TYPE "VPNType" AS ENUM ('free', 'paid');

-- CreateTable
CREATE TABLE "VPN" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "uuid" TEXT NOT NULL,
    "alterId" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "VPNType" NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "expired" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "VPN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Traffic" (
    "id" SERIAL NOT NULL,
    "vpnId" INTEGER NOT NULL,
    "uplink" BIGINT NOT NULL DEFAULT 0,
    "downlink" BIGINT NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Traffic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VPN_email_key" ON "VPN"("email");

-- AddForeignKey
ALTER TABLE "VPN" ADD CONSTRAINT "VPN_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Traffic" ADD CONSTRAINT "Traffic_vpnId_fkey" FOREIGN KEY ("vpnId") REFERENCES "VPN"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
