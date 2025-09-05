import { Bot, InlineKeyboard } from "gramio";
import { prisma } from "../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { addDays } from "date-fns";
import { toShamsi } from "../../utils/shamsiDate.js";

export function registerFreeGiftService(bot: Bot) {
  bot.callbackQuery(/^claim_reward_(\d+)$/, async (ctxRaw) => {
    const match = (ctxRaw.queryPayload as string)?.match(
      /^claim_reward_(\d+)$/
    );

    if (!match || !match[1]) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ user ID نامعتبر است.",
        show_alert: true,
      });
    }

    const userId = parseInt(match[1], 10);

    // Immediately change button → "⏳ در حال پردازش..."
    try {
      if (ctxRaw.message) {
        const processingKeyboard = new InlineKeyboard().text(
          "⏳ لطفا صبر کنید... ",
          "noop"
        );
        await ctxRaw.message.editReplyMarkup(processingKeyboard);
      }
    } catch (err) {
      console.error("Failed to update button:", err);
    }

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(userId) },
      select: { id: true, referralCount: true, referralRewardsClaimed: true },
    });

    if (!user) {
      return ctxRaw.answerCallbackQuery({
        text: "❌ کاربر یافت نشد.",
        show_alert: true,
      });
    }

    const availableRewards = Math.floor(user.referralCount / 3);

    if (availableRewards > user.referralRewardsClaimed) {
      // Calculate traffic limit in bytes
      const trafficLimit = 25 * 1024 * 1024 * 1024;

      // Calculate expiration date
      const expiresAt = addDays(new Date(), 30);
      const shamsiDate = toShamsi(expiresAt);

      // 1. Update claimed rewards
      await prisma.user.update({
        where: { telegramId: BigInt(userId) },
        data: { referralRewardsClaimed: { increment: 1 } },
      });

      const { config, email, uuid, alterId } = await generateConfig({
        telegramId: BigInt(userId),
        accountType: "paid",
        name: ctxRaw.from?.username,
        trafficLimit: 25,
      });

      await prisma.vPN.create({
        data: {
          email,
          uuid,
          alterId,
          userId: user.id,
          type: "paid",
          trafficLimit,
          planId: 2,
          expiredAt: expiresAt,
          expired: false,
        },
      });

      // Send config to user
      await bot.api.sendMessage({
        chat_id: userId.toString(),
        text:
          `🎉 تراکنش شما تایید شد ! اکانت پرمیوم شما:\n\n` +
          `🧩 کانفیگ شما (با کیلیک روش کپی میشه):\n\n<code>${config}</code>\n\n` +
          `📦 حجم: 25GB\n` +
          `⏳ تاریخ پایان: ${shamsiDate}`,
        parse_mode: "HTML",
      });

      if (ctxRaw.message) {
        const rewardKeyboard = new InlineKeyboard().text(
          "🎉 دریافت اکانت جایزه",
          `claim_reward_${userId}`
        );
        await ctxRaw.message.editReplyMarkup(rewardKeyboard);
      }
    } else {
      await ctxRaw.answerCallbackQuery({
        text: "❌ هنوز به ۳ نفر دعوتی که خرید کرده باشن نرسیده‌اید.",
        show_alert: true,
      });

      // also restore button after failure
      if (ctxRaw.message) {
        const rewardKeyboard = new InlineKeyboard().text(
          "🎉 دریافت اکانت جایزه",
          `claim_reward_${userId}`
        );
        await ctxRaw.message.editReplyMarkup(rewardKeyboard);
      }
    }
  });
}
