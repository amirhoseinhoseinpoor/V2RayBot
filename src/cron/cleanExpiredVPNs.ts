import { prisma } from "../db/index.js";
import { deleteV2RayUser } from "../services/v2ray/v2rayApi.js";
import { addDays, isBefore } from "date-fns";

export async function cleanExpiredVPNs() {
  const now = new Date();

  // Fetch all VPNs and filter expired ones manually
  const vpns = await prisma.vPN.findMany({
    where: { expired: false },
    include: { user: true, plan: true },
  });

  const expiredVPNS: typeof vpns = [];

  for (const vpn of vpns) {

     let expirationDate;

     
    if (vpn.type === 'free') {
      expirationDate = addDays(vpn.createdAt, 1);

    } else if (vpn.plan && vpn.type === 'paid') {
      // Paid account with plan: createdAt + plan.duration days
      expirationDate = addDays(vpn.createdAt, vpn.plan.duration);
    } else {
      // Paid but no plan set → default to 30 days
      expirationDate = addDays(vpn.createdAt, 30);
    }

    if (isBefore(expirationDate, now)) {
      expiredVPNS.push(vpn);
    }
  }

  let successfulDeletions = 0;

  for (const vpn of expiredVPNS) {
    const deleted = await deleteV2RayUser({
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
    console.log("✅ Reset V2Ray stats after cleaning user.");
  } else {
    console.log("📭 No expired VPNs successfully cleaned.");
  }
}
