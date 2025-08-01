// registerBuyServiceHandlers.ts
import { Bot, InlineKeyboard } from "gramio";
import { VPN_PLANS } from "../../constants/plans.js";
import {
  buyVPN,
  selectPlan,
  backToPlans,
} from "../../shared/callback-data/buyVPN.js";
import { getSession } from "../../sessionHelper.js";
import { prisma } from "../../db/index.js";
import { paymentAdminKeyboard } from "../../shared/keyboards/paymentAdminKeyboard.js";

export function registerBuyServiceHandlers(bot: Bot) {
  bot.callbackQuery(selectPlan, async (ctx) => {
    const plan = VPN_PLANS.find((p) => p.id === ctx.queryData.planId);
    if (!plan) {
      await ctx.answerCallbackQuery({ text: "Invalid plan selection" });
      return;
    }

    const paymentInfo = `
💳 *مشخصات پرداخت*\n
vpn: ${plan.name}
حجم: ${plan.trafficGB === 999 ? "نامحدود" : `${plan.trafficGB}GB`}
مدت: ${plan.duration} روز
مبلغ: ${plan.price}T تومان

1. لطفا ${plan.price}T به شماره کارت زیر واریز کنید:\n
   💳 شماره کارت: \`5029381042707133\`\n
   👤 به نام: امیرحسین حسین پور
   🏦 بانک: دی

2. لطفا از رسید پرداخت اسکرین شات بگیرید
3. رسید را همینجا داخل چت آپلود کنید`;

    await ctx.editText(paymentInfo, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text(
        "↩️ بازگشت",
        backToPlans.pack("back")
      ),
    });

    const session = getSession(ctx);
    session.waitingForReceipt = {
      planId: plan.id.toString(),
      startedAt: Date.now(),
    };
  });

  bot.callbackQuery(backToPlans, async (ctx) => {
    const keyboard = new InlineKeyboard();
    VPN_PLANS.forEach((plan) => {
      keyboard
        .text(
          `${plan.name} - $${plan.price}`,
          selectPlan.pack({ planId: plan.id })
        )
        .row();
    });

    await ctx.editText("📊 vpn مورد نظر خود را انتخاب کنید:", {
      reply_markup: keyboard,
    });
  });

  bot.on("message", async (ctx) => {
    const session = getSession(ctx);
    if (!session.waitingForReceipt) return;

    const { planId } = session.waitingForReceipt;
    const plan = VPN_PLANS.find((p) => p.id === Number(planId));
    if (!plan) {
      await ctx.send("این vpn درحال حاضر موجود نیست.");
      return;
    }

    const fileId = ctx.photo
      ? ctx.photo[ctx.photo.length - 1]?.fileId
      : ctx.document?.fileId;

    if (!fileId) {
      await ctx.reply("❌ لطفا یک تصویر یا سند معتبر ارسال کنید");
      return;
    }

    const user = await prisma.user.upsert({
      where: { telegramId: ctx.from?.id },
      create: {
        telegramId: ctx.from?.id || BigInt(0),
        firstName: ctx.from?.firstName || "",
        username: ctx.from?.username || "",
      },
      update: {},
    });

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        amount: plan.price,
        receipt: fileId,
        status: "pending",
      },
    });

    await bot.api.sendPhoto({
      chat_id: process.env.ADMIN_CHAT_ID!,
      photo: fileId,
      caption:
        `⚠️ پرداختی جدید\n\n` +
        `👤 کاربر: ${ctx.from?.firstName || ""} (@${
          ctx.from?.username || "no-username"
        })\n` +
        `🆔 ID: ${ctx.from?.id}\n` +
        `📋 vpn: ${plan.name}\n` +
        `📦 حجم: ${plan.trafficGB}GB\n` +
        `⏳ مدت: ${plan.duration} روز\n` +
        `💰 مبلغ: ${plan.price}T\n` +
        `📝 Payment ID: ${payment.id}`,
      reply_markup: paymentAdminKeyboard(payment.id),
    });

    session.waitingForReceipt = undefined;
    await ctx.reply(
      "📨 رسید شما دریافت شد ما در اسرع وقت ان را چک میکنیم و همینجا کانفیگ رو براتون ارسال میکنیم از صبر و شکیبایی شما مچکریم."
    );
  });
}
