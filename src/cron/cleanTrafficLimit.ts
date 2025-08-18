import { prisma } from "../db/index.js";
import { deleteV2RayUser } from "../services/v2ray/v2rayApi.js";
import { bot } from "../bot.js";
import { addDays, isBefore, format } from "date-fns";

export async function cleanTrafficLimit() {
  const now = new Date();

  const vpns = await prisma.vPN.findMany({
    where: {
      expired: false,
    },
    include: {
      user: true,
      trafficLogs: true,
      plan: true,
    },
  });

  const ONE_DAY_MS = 1000 * 60 * 60 * 24; // 1 day in milliseconds

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
        if (vpn.savedDays > 0 && vpn.savedTraffic > 0) {
          const newExpiredAt = vpn.savedDays
        ? addDays(new Date(), vpn.savedDays)
        : vpn.expiredAt;

          await prisma.vPN.update({
            where: { id: vpn.id },
            data: {
              expired: false,
              expiredAt: newExpiredAt,
              createdAt: new Date(),
              trafficNotify: false,
              timeNotify: false,
              trafficLimit: vpn.savedTraffic,
              savedDays: 0,
              savedTraffic: 0,
            },
          });

          // Reset traffic
          await prisma.traffic.update({
            where: { vpnId: vpn.id },
            data: {
              uplink: 0n,
              downlink: 0n,
            },
          });

          await bot.api.sendMessage({
            chat_id: vpn.user.telegramId.toString(),
            text: `✅ اشتراک VPN شما به اتمام رسید و وی پی ان تمدید شده به‌صورت خودکار برای شما فعال شد .`,
          });
        } else {
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

          await bot.api.sendMessage({
            chat_id: vpn.user.telegramId.toString(),
            text: `⛔️ اشتراک شما به پایان رسید و به علت عدم تمدید وی پی ان شما قطع شد \n\n لطفا از منوی خرید سرویس وی پی ان جدید خود را خریداری نمایید`,
          });

          cleanedCount++;
        }
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
