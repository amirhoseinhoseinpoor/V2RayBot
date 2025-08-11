import { prisma } from "../db/index.js";
import { getUserTraffic, resetV2RayStats } from "../services/v2ray/v2rayApi.js";

export async function collectHourlyTraffic() {
  const vpns = await prisma.vPN.findMany({
    where: { expired: false },
    include: { user: true },
  });

  const now = new Date();
  const startOfHour = new Date(now);
  startOfHour.setMinutes(0, 0, 0); // round to start of hour

  let collectedCount = 0;

  for (const vpn of vpns) {
    try {
      const stats = await getUserTraffic(vpn.email);
      if (!stats) {
        console.warn(`⚠️ Skipping: VPN ${vpn.email} not found in V2Ray`);
        continue;
      }

      console.log(
        `🔢 [${vpn.email}] Uplink: ${stats.uplink}, Downlink: ${stats.downlink}`
      );

      await prisma.traffic.upsert({
        where: { vpnId_timestamp: { vpnId: vpn.id, timestamp: startOfHour } },
        update: {
          uplink: { increment: BigInt(Math.floor(stats.uplink)) },
          downlink: { increment: BigInt(Math.floor(stats.downlink)) },
        },
        create: {
          vpnId: vpn.id,
          uplink: BigInt(Math.floor(stats.uplink)),
          downlink: BigInt(Math.floor(stats.downlink)),
          timestamp: startOfHour,
        },
      });

      collectedCount++;
    } catch (err) {
      console.error(`❌ Error collecting for ${vpn.email}:`, err);
    }
  }

  if (collectedCount > 0) {
    await resetV2RayStats();
    console.log(
      `✅ Collected traffic for ${collectedCount} VPNs and reset stats.`
    );
  } else {
    console.log("📭 No traffic collected.");
  }
}
