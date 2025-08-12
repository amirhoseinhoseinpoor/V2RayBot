// src/cron/collectHourlyTraffic.ts
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../db/index.js";
import { getUserTraffic, resetV2RayStats } from "../services/v2ray/v2rayApi.js";

const redis = new (Redis as any)(process.env.REDIS_URL);
const LOCK_KEY = "collectHourlyTraffic:lock";
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes (adjust if your run can take longer)

export async function collectHourlyTraffic() {
  // Try to acquire distributed lock
  const token = uuidv4();
  const got = await redis.set(LOCK_KEY, token, "NX", "PX", LOCK_TTL_MS);

  if (!got) {
    console.log(
      "⏳ collectHourlyTraffic: another instance is running — skipping this run."
    );
    return;
  }

  try {
    const vpns = await prisma.vPN.findMany({
      where: { expired: false },
      select: { id: true, email: true },
    });

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

        // Upsert using the canonical startOfHour — this prevents duplicates
        await prisma.traffic.upsert({
          where: { vpnId: vpn.id },
          update: {
            uplink: { increment: BigInt(Math.floor(stats.uplink)) },
            downlink: { increment: BigInt(Math.floor(stats.downlink)) },
            timestamp: new Date(), // last updated time
          },
          create: {
            vpnId: vpn.id,
            uplink: BigInt(Math.floor(stats.uplink)),
            downlink: BigInt(Math.floor(stats.downlink)),
            timestamp: new Date(),
          },
        });

        collectedCount++;
      } catch (err) {
        console.error(`❌ Error collecting for ${vpn.email}:`, err);
      }
    }

    if (collectedCount > 0) {
      try {
        await resetV2RayStats();
        console.log(
          `✅ Collected traffic for ${collectedCount} VPNs and reset stats.`
        );
      } catch (err) {
        console.error("❌ Failed to reset V2Ray stats (non-fatal):", err);
      }
    } else {
      console.log("📭 No traffic collected.");
    }
  } finally {
    // only release lock if we still own it
    try {
      const current = await redis.get(LOCK_KEY);
      if (current === token) {
        await redis.del(LOCK_KEY);
      }
    } catch (releaseErr) {
      console.error(
        "⚠️ Error releasing collectHourlyTraffic lock:",
        releaseErr
      );
    }
  }
}
