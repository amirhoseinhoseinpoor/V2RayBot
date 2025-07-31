import { prisma } from "../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { addDays } from "date-fns";
import type { Bot } from "gramio";
import {
  confirmPayment,
  rejectPayment,
} from "../../shared/callback-data/buyVPN.js";

export function registerAdminHandlers(bot: Bot) {
  // Confirm payment and create VPN
  bot.callbackQuery(confirmPayment, async (ctx) => {
    const paymentId = ctx.queryData.paymentId;

    // Fetch payment with relations
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!payment) {
      await ctx.answerCallbackQuery({ text: "Payment not found" });
      return;
    }

    // Calculate traffic limit in bytes
    const trafficLimit = payment.plan.trafficGB * 1024 * 1024 * 1024;

    // Calculate expiration date
    const expiresAt = addDays(new Date(), payment.plan.duration);

    try {
      // Generate V2Ray configuration
      const v2rayConfig = await generateConfig(
        payment.user.telegramId,
        "paid",
        payment.plan.trafficGB // Pass the raw GB value (number)
      );

      // Create VPN record
      await prisma.vPN.create({
        data: {
          userId: payment.user.id,
          email: v2rayConfig.email,
          uuid: v2rayConfig.uuid,
          type: "paid",
          expiresAt,
          trafficLimit,
          alterId: v2rayConfig.alterId,
        },
      });

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "confirmed" },
      });

      // Send config to user
      await bot.api.sendMessage({
        chat_id: payment.user.telegramId.toString(),
        text:
          `🎉 Payment confirmed! Your premium VPN access:\n\n` +
          `🧩 Configuration:\n<code>${v2rayConfig.config}</code>\n\n` +
          `📦 Traffic: ${
            payment.plan.trafficGB === 999
              ? "Unlimited"
              : `${payment.plan.trafficGB}GB`
          }\n` +
          `⏳ Expires: ${expiresAt.toLocaleDateString()}`,
        parse_mode: "HTML",
      });

      // Update admin UI
      await bot.api.editMessageCaption({
        caption: `✅ Approved Payment #${paymentId}`,
      });
      await ctx.answerCallbackQuery({ text: "VPN created and user notified!" });
    } catch (error) {
      console.error("VPN creation failed:", error);
      await ctx.answerCallbackQuery({ text: "Error creating VPN" });
    }
  });

  // Reject payment
  bot.callbackQuery(rejectPayment, async (ctx) => {
    const paymentId = ctx.queryData.paymentId;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "rejected" },
      include: { user: true },
    });

    // Notify user
    await bot.api.sendMessage({
      chat_id: payment.user.telegramId.toString(),
      text:
        "❌ Payment rejected. Please verify:\n" +
        "1. Correct amount was sent\n" +
        "2. Receipt is clear and valid\n" +
        "3. Card details match\n\n" +
        "Resend receipt or contact support",
    });

    // Update admin UI
    await bot.api.editMessageCaption({
      caption: `❌ Rejected Payment #${paymentId}`,
    });
    await ctx.answerCallbackQuery({ text: "User notified to resend" });
  });
}
