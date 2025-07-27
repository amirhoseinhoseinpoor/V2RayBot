import { prisma } from "../db/index.js";
import {
  deleteV2RayUser,
  resetV2RayStats,
} from "../services/v2ray/v2rayApi.js";
import { subDays, isBefore } from "date-fns";

export async function cleanExpiredVPNs() {
  const now = new Date();

  // Fetch all VPNs and filter expired ones manually
  const vpns = await prisma.vPN.findMany({
    include: { user: true },
  });

  const expiredVPNS: typeof vpns = [];

  for (const vpn of vpns) {
    const createdAt = vpn.createdAt;
    const isFree = vpn.user?.freeAccount || false;

    const expirationDate = isFree
      ? subDays(now, 1) // test accounts expire after 1 day
      : subDays(now, 30); // normal accounts expire after 30 days

    if (isBefore(createdAt, expirationDate)) {
      expiredVPNS.push(vpn);
    }
  }

  let successfulDeletions = 0;

  for (const vpn of expiredVPNS) {
    const deleted = await deleteV2RayUser({
      id: vpn.uuid,
      alterId: vpn.alterId ?? 0,
      email: vpn.email,
    });

    if (deleted) {
      await prisma.vPN.update({
        where: { id: vpn.id },
        data: { expired: true },
      });

      successfulDeletions++;
    } else {
      console.warn(`⚠️ Skipped marking VPN as expired: ${vpn.email}`);
    }
  }

  if (successfulDeletions > 0) {
    await resetV2RayStats();
    console.log("✅ Reset V2Ray stats after cleaning.");
  } else {
    console.log("📭 No expired VPNs successfully cleaned.");
  }
}
