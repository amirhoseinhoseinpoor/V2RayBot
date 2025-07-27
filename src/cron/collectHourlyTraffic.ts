// cron/collectHourlyTraffic.ts

import { prisma } from "../db/index.js";
import { getUserTraffic, resetV2RayStats } from "../services/v2ray/v2rayApi.js";

export async function collectHourlyTraffic() {
  const vpns = await prisma.vPN.findMany({
    where: { expired: false },
    include: { user: true },
  });

  let collectedCount = 0;

  for (const vpn of vpns) {
    try {
      const stats = await getUserTraffic(vpn.email);

      if (!stats) {
        console.warn(
          `⚠️ Skipping traffic logging: VPN ${vpn.email} not found in V2Ray`
        );
        continue;
      }

      await prisma.traffic.create({
        data: {
          vpnId: vpn.id,
          uplink: BigInt(stats.uplink),
          downlink: BigInt(stats.downlink),
        },
      });
      collectedCount++;
    } catch (err) {
      console.error(`❌ Failed to collect traffic for ${vpn.email}:`, err);
    }
  }

  if (collectedCount > 0) {
    await resetV2RayStats();
    console.log(
      `✅ Collected traffic for ${collectedCount} VPNs and reset stats.`
    );
  } else {
    console.log("📭 No traffic collected this hour.");
  }
}
