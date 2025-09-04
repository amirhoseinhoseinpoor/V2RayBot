import { prisma } from "../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { addDays } from "date-fns";
import type { Bot } from "gramio";
import {
  confirmPayment,
  rejectPayment,
} from "../../shared/callback-data/buyVPN.js";
import { toShamsi } from "../../utils/shamsiDate.js";

export function registerAdminHandlers(bot: Bot) {
  // Confirm payment and create VPN
  bot.callbackQuery(confirmPayment, async (ctx) => {
    const paymentId = ctx.queryData.paymentId;
    const holdOver = ctx.queryData.holdOver;
    const vpnId = ctx.queryData.vpnId;

    // Fetch payment with relations
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: true,
        plan: true,
      },
    });

    if (!payment) {
      await ctx.answerCallbackQuery({ text: "پرداخت یافت نشد" });
      return;
    }

    // Calculate traffic limit in bytes
    const trafficLimit = payment.plan.trafficGB * 1024 * 1024 * 1024;

    // Calculate expiration date
    const expiresAt = addDays(new Date(), payment.plan.duration);
    const shamsiDate = toShamsi(expiresAt);

    if (holdOver && vpnId !== 0) {
      try {
        await prisma.vPN.update({
          where: {
            id: vpnId,
          },
          data: {
            savedDays: payment.plan.duration,
            savedTraffic: trafficLimit,
            savedPlanId: payment.plan.id,
          },
        });

        // Update payment status
        await prisma.payment.update({
          where: { id: paymentId },
          data: { status: "confirmed" },
        });

        await bot.api.sendMessage({
          chat_id: payment.user.telegramId.toString(),
          text:
            `🎉 تراکنش شما تایید شد شما میتونید وی پی ان رزرو شده خودتون رو در بخش سرویس های من مشاهده کنید!:\n\n` +
            `🧩 پس از اتمام وی پی ان فعلی و پی ان رزرو شده برای شما برای همون کانفیگ فعال خواهد شد`,
          parse_mode: "HTML",
        });

        if (ctx.message) {
          const originalCaption = ctx.message.caption || "";
          try {
            await bot.api.editMessageCaption({
              chat_id: ctx.message.chat.id,
              message_id: ctx.message.id,
              caption: `${originalCaption}\n\n✅ تراکنش تمدید تایید شد`,
              parse_mode: "Markdown",
              reply_markup: undefined,
            });
          } catch (error) {
            // If editing fails (e.g. message too old), send a new message instead
            await bot.api.sendMessage({
              chat_id: ctx.message.chat.id,
              text: `✅ تراکنش تمدید تایید شد`,
            });
          }
        }

        // if user was referred and not yet counted
        if (payment.user.referredBy && !payment.user.referralCounted) {
          await prisma.user.update({
            where: { telegramId: payment.user.telegramId },
            data: {
              referralCounted: true, // mark as counted
            },
          });

          // increment referrer's counter
          await prisma.user.update({
            where: { telegramId: payment.user.referredBy },
            data: {
              referralCount: { increment: 1 },
            },
          });
        }
      } catch (error) {
        console.error("VPN holdOver failed:", error);
        await ctx.answerCallbackQuery({ text: "خطا در تمدید VPN" });
      }
    } else {
      try {
        // Generate V2Ray configuration
        const v2rayConfig = await generateConfig({
          telegramId: payment.user.telegramId,
          accountType: "paid",
          trafficLimit: payment.plan.trafficGB,
          name: payment.user.username || undefined,
        });

        // Create VPN record
        await prisma.vPN.create({
          data: {
            userId: payment.user.id,
            email: v2rayConfig.email,
            uuid: v2rayConfig.uuid,
            type: "paid",
            trafficLimit,
            alterId: v2rayConfig.alterId,
            planId: payment.plan.id,
            expiredAt: expiresAt,
            expired: false,
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
            `🎉 تراکنش شما تایید شد ! اکانت پرمیوم شما:\n\n` +
            `🧩 کانفیگ شما (با کیلیک روش کپی میشه):\n\n<code>${v2rayConfig.config}</code>\n\n` +
            `📦 حجم: ${
              payment.plan.trafficGB === 999
                ? "نامحدود"
                : `${payment.plan.trafficGB}GB`
            }\n` +
            `⏳ تاریخ پایان: ${shamsiDate}`,
          parse_mode: "HTML",
        });

        // Try to edit the admin message caption to show confirmation and remove buttons
        if (ctx.message) {
          const originalCaption = ctx.message.caption || "";
          try {
            await bot.api.editMessageCaption({
              chat_id: ctx.message.chat.id,
              message_id: ctx.message.id,
              caption: `${originalCaption}\n\n✅ تراکنش تایید شد #${paymentId}`,
              parse_mode: "Markdown",
              reply_markup: undefined,
            });
          } catch (error) {
            // If editing fails (e.g. message too old), send a new message instead
            await bot.api.sendMessage({
              chat_id: ctx.message.chat.id,
              text: `✅ تراکنش تایید شد #${paymentId} (نمیتوان پیام قبلی را ویرایش کرد)`,
            });
          }
        }

        // if user was referred and not yet counted
        if (payment.user.referredBy && !payment.user.referralCounted) {
          await prisma.user.update({
            where: { telegramId: payment.user.telegramId },
            data: {
              referralCounted: true, // mark as counted
            },
          });

          // increment referrer's counter
          await prisma.user.update({
            where: { telegramId: payment.user.referredBy },
            data: {
              referralCount: { increment: 1 },
            },
          });
        }

        await ctx.answerCallbackQuery({
          text: "VPN ایجاد شد و کاربر مطلع شد!",
        });
      } catch (error) {
        console.error("VPN creation failed:", error);
        await ctx.answerCallbackQuery({ text: "خطا در ایجاد VPN" });
      }
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

    // Notify user about rejection
    await bot.api.sendMessage({
      chat_id: payment.user.telegramId.toString(),
      text:
        "❌ تراکنش ناموفق! لطفا موارد زیر را برسی کنید:\n\n" +
        "1. مبلغ صحیح پرداخت نشده\n" +
        "2. رسید واضح نیست\n" +
        "3. جزئیات کارت مطابقت ندارد\n\n" +
        "لطفا دوباره ثبت سفارش کنید یا با پشتیبانی تماس بگیرید .",
    });

    // Try to edit the admin message caption to show rejection and remove buttons
    if (ctx.message) {
      const originalCaption = ctx.message.caption || "";
      try {
        await bot.api.editMessageCaption({
          chat_id: ctx.message.chat.id,
          message_id: ctx.message.id,
          caption: `${originalCaption}\n\n❌ تراکنش رد شد #${paymentId}`,
          parse_mode: "Markdown",
          reply_markup: undefined,
        });
      } catch (error) {
        // If editing fails (e.g. message too old), send a new message instead
        await bot.api.sendMessage({
          chat_id: ctx.message.chat.id,
          text: `❌ تراکنش رد شد #${paymentId} (نمیتوان پیام قبلی را ویرایش کرد)`,
        });
      }
    }

    await ctx.answerCallbackQuery({ text: "کاربر مطلع شد که دوباره بفرسته" });
  });
}
