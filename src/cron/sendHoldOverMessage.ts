import { prisma } from "../db/index.js";
import { bot } from "../bot.js";

export async function sendHoldOverMessage() {
  const vpns = await prisma.vPN.findMany({
    where: { expired: false },
    include: {
      user: true,
      trafficLogs: true, // array of all traffic logs
    },
  });

  const ONE_DAY_MS = 1000 * 60 * 60 * 24; // 1 day in milliseconds
  const ONE_WEEK_MS = 7 * ONE_DAY_MS; // 1 week in milliseconds

  const now = Date.now();

  for (const vpn of vpns) {
    // Sum uplink and downlink
    const totalTraffic = vpn.trafficLogs.reduce(
      (acc, log) => acc + Number(log.uplink) + Number(log.downlink),
      0
    );

    // Skip if trafficLimit is 0 to avoid division by zero
    if (!vpn.trafficLimit) continue;

    // Check if traffic > 85%
    if (!vpn.trafficNotify && totalTraffic / Number(vpn.trafficLimit) >= 0.85) {
      await bot.api.sendMessage({
        chat_id: vpn.user.telegramId.toString(),
        text: `⚠️ شما 85٪ از حجم VPN خود را استفاده کرده‌اید لطفا جهت جلوگیری از قطع شدن نسبت به تمدید اشتراک خود اقدام کنید.`,
      });

      await prisma.vPN.update({
        where: { id: vpn.id },
        data: { trafficNotify: true },
      });
    }

    if (vpn.type == "paid") {
      // Optional: check for last week before expiration
      if (!vpn.timeNotify && vpn.expiredAt) {
        const timeRemaining = vpn.expiredAt.getTime() - now;

        if (timeRemaining <= ONE_WEEK_MS) {
          await bot.api.sendMessage({
            chat_id: vpn.user.telegramId.toString(),
            text: `⏳ یک هفته تا تاریخ انقضای وی پی ان شما مانده است لطفا جهت جلوگیری از قطع شدن ان را تمدید نمایید`,
          });
          await prisma.vPN.update({
            where: { id: vpn.id },
            data: { timeNotify: true },
          });
        }
      }
    }
  }
}
