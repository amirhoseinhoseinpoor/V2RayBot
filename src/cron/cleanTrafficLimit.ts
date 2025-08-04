import { prisma } from "../db/index.js";
import {
  deleteV2RayUser,
} from "../services/v2ray/v2rayApi.js";

export async function cleanTrafficLimit() {
  const vpns = await prisma.vPN.findMany({
    where: {
      expired: false,
    },
    include: {
      trafficLogs: true,
      plan: true,
    },
  });

  let cleanedCount = 0;

  for (const vpn of vpns) {
    let limit: bigint;

    if (vpn.type === "free") {
      limit = 300n * 1024n * 1024n; // 300MB
    } else if (vpn.type === "paid") {
      const planTraffic = vpn.plan?.trafficGB ?? 25; // fallback if missing
      limit = BigInt(planTraffic) * 1024n * 1024n * 1024n; // Convert GB to bytes
    } else {
      console.warn(`⚠️ Unknown VPN type: ${vpn.type}, skipping...`);
      continue;
    }

    const totalUplink = vpn.trafficLogs.reduce(
      (sum, log) => sum + log.uplink,
      0n
    );
    const totalDownlink = vpn.trafficLogs.reduce(
      (sum, log) => sum + log.downlink,
      0n
    );
    const totalTraffic = totalUplink + totalDownlink;

    if (totalTraffic > limit) {
      try {
        const trafficMB = Number(totalTraffic) / 1024 / 1024;
        console.log(
          `🚫 VPN (${vpn.type}) ${
            vpn.email
          } exceeded limit: ${trafficMB.toFixed(2)} MB`
        );

        await deleteV2RayUser({ email: vpn.email }); // updated API

        await prisma.vPN.update({
          where: { id: vpn.id },
          data: { expired: true },
        });

        cleanedCount++;
      } catch (err) {
        console.error(`❌ Failed to delete over-limit VPN ${vpn.email}:`, err);
      }
    }
  }

  if (cleanedCount > 0) {
    console.log(`✅ Cleaned ${cleanedCount} VPNs (over traffic limit)`);
  } else {
    console.log("📭 No VPNs exceeded their traffic limits.");
  }
}
