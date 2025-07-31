// registerBuyServiceHandlers.ts
import { Bot, InlineKeyboard } from "gramio";
import { VPN_PLANS } from "../../constants/plans.js";
import { buyVPN, selectPlan, backToPlans } from "../../shared/callback-data/buyVPN.js";
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
💳 *Payment Instructions*
Plan: ${plan.name}
Traffic: ${plan.trafficGB === 999 ? "Unlimited" : `${plan.trafficGB}GB`}
Duration: ${plan.duration} days
Amount: $${plan.price}

1. Send $${plan.price} to:
   💳 Card: \`1234 5678 9012 3456\`
   👤 Name: YOUR NAME
   🏦 Bank: YOUR BANK

2. Take a screenshot of the payment receipt
3. Upload the receipt here`;

    await ctx.editText(paymentInfo, {
      parse_mode: "Markdown",
      reply_markup: new InlineKeyboard().text(
        "↩️ Back to plans",
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
      keyboard.text(`${plan.name} - $${plan.price}`, selectPlan.pack({ planId: plan.id })).row();
    });

    await ctx.editText("📊 Choose a VPN plan:", {
      reply_markup: keyboard,
    });
  });

  bot.on("message", async (ctx) => {
    const session = getSession(ctx);
    if (!session.waitingForReceipt) return;

    const { planId } = session.waitingForReceipt;
    const plan = VPN_PLANS.find((p) => p.id === Number(planId));
    if (!plan) {
      await ctx.send("Plan no longer available");
      return;
    }

    const fileId = ctx.photo
      ? ctx.photo[ctx.photo.length - 1]?.fileId
      : ctx.document?.fileId;

    if (!fileId) {
      await ctx.reply("❌ Please send a valid image or document");
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
      caption: `⚠️ New Payment Review\n\n` +
        `👤 User: ${ctx.from?.firstName || ""} (@${ctx.from?.username || "no-username"})\n` +
        `🆔 ID: ${ctx.from?.id}\n` +
        `📋 Plan: ${plan.name}\n` +
        `📦 Traffic: ${plan.trafficGB}GB\n` +
        `⏳ Duration: ${plan.duration} days\n` +
        `💰 Amount: $${plan.price}\n` +
        `📝 Payment ID: ${payment.id}`,
      reply_markup: paymentAdminKeyboard(payment.id),
    });

    session.waitingForReceipt = undefined;
    await ctx.reply("📨 Receipt received! We'll verify and activate your account shortly.");
  });
}
