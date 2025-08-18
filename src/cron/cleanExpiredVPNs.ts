import { prisma } from "../db/index.js";
import { deleteV2RayUser } from "../services/v2ray/v2rayApi.js";
import { addDays, isBefore, format } from "date-fns";
import { bot } from "../bot.js";

export async function cleanExpiredVPNs() {
  const now = new Date();

  // Fetch all VPNs and filter expired ones manually
  const vpns = await prisma.vPN.findMany({
    where: { expired: false },
    include: { user: true, plan: true, trafficLogs: true },
  });

  const ONE_DAY_MS = 1000 * 60 * 60 * 24; // 1 day in milliseconds

  const expiredVPNS: typeof vpns = [];

  for (const vpn of vpns) {
    let expirationDate;

    if (vpn.type === "free") {
      expirationDate = addDays(vpn.createdAt, 1);
    } else if (vpn.plan && vpn.type === "paid") {
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

      // Reset used traffic to 0
      await prisma.traffic.update({
        where: { vpnId: vpn.id },
        data: {
          uplink: 0,
          downlink: 0,
        },
      });

      await bot.api.sendMessage({
        chat_id: vpn.user.telegramId.toString(),
        text: `✅ اشتراک VPN شما به اتمام رسید و وی پی ان تمدید شده به‌صورت خودکار برای شما فعال شد .`,
      });
    } else {
      const deleted = await deleteV2RayUser({
        email: vpn.email,
      });

      if (deleted) {
        await prisma.vPN.update({
          where: { id: vpn.id },
          data: { expired: true },
        });

        await bot.api.sendMessage({
          chat_id: vpn.user.telegramId.toString(),
          text: `⛔️ اشتراک شما به پایان رسید و به علت عدم تمدید وی پی ان شما قطع شد \n\n لطفا از منوی خرید سرویس وی پی ان جدید خود را خریداری نمایید`,
        });

        successfulDeletions++;
      } else {
        console.warn(`⚠️ Skipped marking VPN as expired: ${vpn.email}`);
      }
    }
  }

  if (successfulDeletions > 0) {
    console.log("✅ Reset V2Ray stats after cleaning user.");
  } else {
    console.log("📭 No expired VPNs successfully cleaned.");
  }
}
