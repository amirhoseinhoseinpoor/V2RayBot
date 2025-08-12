import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../db/index.js";
import { getAllTrafficStats, parseAllUserTraffic, resetV2RayStats } from "../services/v2ray/v2rayApi.js";

const redis = new (Redis as any)(process.env.REDIS_URL);
const LOCK_KEY = "collectHourlyTraffic:lock";
const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function collectHourlyTraffic() {
  // Acquire distributed lock
  const token = uuidv4();
  const got = await redis.set(LOCK_KEY, token, "NX", "PX", LOCK_TTL_MS);

  if (!got) {
    console.log("⏳ collectHourlyTraffic: another instance is running — skipping this run.");
    return;
  }

  try {
    const vpns = await prisma.vPN.findMany({
      where: { expired: false },
      select: { id: true, email: true },
    });

    // Map vpn emails to their IDs for quick lookup
    const emailToVpnId = new Map(vpns.map((vpn) => [vpn.email, vpn.id]));

    // Fetch all traffic stats at once
    const allTrafficRaw = await getAllTrafficStats();

    // Parse all user traffic from raw output
    const allTraffic = parseAllUserTraffic(allTrafficRaw);

    let collectedCount = 0;

    // Iterate over parsed traffic keyed by email
    for (const [email, stats] of Object.entries(allTraffic)) {
      const vpnId = emailToVpnId.get(email);

      if (!vpnId) {
        console.warn(`⚠️ Skipping: VPN ${email} not found in database`);
        continue;
      }

      try {
        console.log(`🔢 [${email}] Uplink: ${stats.uplink}, Downlink: ${stats.downlink}`);

        await prisma.traffic.upsert({
          where: { vpnId }, // Assuming vpnId is unique in Traffic table
          update: {
            uplink: { increment: BigInt(Math.floor(stats.uplink)) },
            downlink: { increment: BigInt(Math.floor(stats.downlink)) },
            timestamp: new Date(),
          },
          create: {
            vpnId,
            uplink: BigInt(Math.floor(stats.uplink)),
            downlink: BigInt(Math.floor(stats.downlink)),
            timestamp: new Date(),
          },
        });

        collectedCount++;
      } catch (err) {
        console.error(`❌ Error updating traffic for ${email}:`, err);
      }
    }

    if (collectedCount > 0) {
      try {
        await resetV2RayStats();
        console.log(`✅ Collected traffic for ${collectedCount} VPNs and reset stats.`);
      } catch (err) {
        console.error("❌ Failed to reset V2Ray stats (non-fatal):", err);
      }
    } else {
      console.log("📭 No traffic collected.");
    }
  } finally {
    // Release lock if owned
    try {
      const current = await redis.get(LOCK_KEY);
      if (current === token) {
        await redis.del(LOCK_KEY);
      }
    } catch (releaseErr) {
      console.error("⚠️ Error releasing collectHourlyTraffic lock:", releaseErr);
    }
  }
}
