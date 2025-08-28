import { InlineKeyboard } from "gramio";
import { prisma } from "../../db/index.js";
import { Bot } from "gramio";
import { toShamsi } from "../../utils/shamsiDate.js";
import { regenerateConfig } from "../../services/configGenerate/RegenerateConfig.js";
import { BuyServiceHandler } from "./buyService.js";

// 📋 Function to list all active VPNs for the user
async function showUserVPNs(ctx: any, userId: number) {
  const vpns = await prisma.vPN.findMany({
    where: {
      userId,
      expired: false,
    },
    include: { plan: true },
  });

  if (!vpns.length) {
    return ctx.editText("❌ هیچ سرویس فعالی یافت نشد.");
  }

  const keyboard = new InlineKeyboard();
  vpns.forEach((vpn) => {
    keyboard
      .text(
        `${vpn.email} (${vpn.plan?.name || "بدون پلن"})`,
        `show_vpn_${vpn.id}`
      )
      .row();
  });

  await ctx.editText(
    "📡 اینجا با انتخاب وی پی ان میتونید تمدیدش کنید \n مشخصاتش ببینید یا اگه کانفیگ گم کردید دوباه بگیریدش\n\n وی پی ان های فعال شما :",
    { reply_markup: keyboard }
  );
}

export function registerActiveServiceHandlers(bot: Bot) {
  // Step 1: User requests active services
  bot.callbackQuery("active_services", async (ctx) => {
    const telegramId = ctx.from?.id;

    if (!telegramId) {
      return ctx.send("❌ Unable to get Telegram ID.");
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      return ctx.send("❌ شما هیچ سرویس فعالی ندارید.");
    }

    await showUserVPNs(ctx, user.id);
  });

  // Step 2: Show specific VPN details
  bot.callbackQuery(/^show_vpn_(\d+)$/, async (ctxRaw) => {
    const ctx = ctxRaw as typeof ctxRaw & { match: RegExpMatchArray };
    const match = (ctxRaw.queryPayload as string)?.match(/^show_vpn_(\d+)$/);

    if (!match || !match[1]) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ VPN ID نامعتبر است.",
        show_alert: true,
      });
    }

    const vpnId = parseInt(match[1]);
    const vpn = await prisma.vPN.findUnique({
      where: { id: vpnId },
      include: { plan: true, trafficLogs: true },
    });

    if (!vpn) {
      return ctx.answerCallbackQuery({
        text: "❌ VPN پیدا نشد.",
        show_alert: true,
      });
    }

    const totalUsed = vpn.trafficLogs.reduce(
      (sum, log) => sum + Number(log.uplink + log.downlink),
      0
    );
    const trafficLeft = Number(vpn.trafficLimit) - totalUsed;

    const trafficInGB = Number(vpn.savedTraffic) / 1024 / 1024 / 1024;

    const expiryDate = vpn.expiredAt
      ? toShamsi(vpn.expiredAt)
      : "در صورت دریافت اکانت روزانه یک روز پس از تحویل";

    const message = `
🔐 مشخصات سرویس:

📧 gmail: ${vpn.email} (${vpn.plan?.name || "بدون پلن"})

🆔 id : ${vpn.uuid}

📦 حجم باقی‌مانده: ${(trafficLeft / 1024 ** 3).toFixed(2)} گیگ

📅 تاریخ انقضا: ${expiryDate}

🔄 وی پی ان تمدید شده: \n ${
      vpn.savedDays && vpn.savedTraffic
        ? `\n ${vpn.savedDays}روزه\n\n${trafficInGB.toFixed(2)}گیگ`
        : `شما وی پی انی برای تمدید بعد از این نخریده اید`
    }
    `.trim();

    const keyboard = new InlineKeyboard()
      .text("🔄 دریافت مجدد کانفیگ", `regen_vpn_${vpn.id}`)
      .row();
    if (!vpn.savedDays && !vpn.savedTraffic) {
      keyboard.text("⏰ تمدید اشتراک", `holdOver_vpn_${vpn.id}`).row();
    }

    keyboard.text("🔙 بازگشت", "active_services");

    await ctx.editText(message, { reply_markup: keyboard });
  });

  // Regen button
  bot.callbackQuery(/^regen_vpn_(\d+)$/, async (ctxRaw) => {
    const match = (ctxRaw.queryPayload as string)?.match(/^regen_vpn_(\d+)$/);
    if (!match || !match[1]) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ VPN ID نامعتبر است.",
        show_alert: true,
      });
    }

    const vpnId = parseInt(match[1]);
    const vpn = await prisma.vPN.findUnique({ where: { id: vpnId } });

    if (!vpn) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ VPN پیدا نشد.",
        show_alert: true,
      });
    }

    const { config } = await regenerateConfig({
      uuid: vpn.uuid,
      email: vpn.email,
      alterId: 0,
      accountType: vpn.type || "free",
      port: parseInt(process.env.V2RAY_API_PORT!),
      network: "tcp",
      type: "none",
      host: process.env.VPS_HOSTIRAN,
      path: "",
      tls: "none",
    });

    await ctxRaw.send(`🔄 کانفیگ مجدد شما:\n\n<code>${config}</code>`, {
      parse_mode: "HTML",
    });
    await ctxRaw.answerCallbackQuery({ text: "📤 کانفیگ ارسال شد." });
  });

  bot.callbackQuery(/^holdOver_vpn_(\d+)$/, async (ctxRaw) => {
    const match = (ctxRaw.queryPayload as string)?.match(
      /^holdOver_vpn_(\d+)$/
    );

    if (!match || !match[1]) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ VPN ID نامعتبر است.",
        show_alert: true,
      });
    }

    const vpnId = parseInt(match[1]);

    // ✅ Pass ctxRaw into the returned handler
    const handler = BuyServiceHandler(true, vpnId);
    await handler(ctxRaw);
  });
}
