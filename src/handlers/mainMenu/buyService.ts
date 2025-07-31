
import { CallbackQueryContext } from "gramio";
import { InlineKeyboard, Bot } from "gramio";
import { MessageContext } from "gramio";
import { bot } from "../../bot.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { prisma } from "../../db/index.js";

import { VPN_PLANS } from "../../constants/plans.js";
import {
  buyVPN,
  selectPlan,
  backToPlans,
} from "../../shared/callback-data/buyVPN.js";
import { getSession } from "../../sessionHelper.js";






export async function BuyServiceHandler(ctx: any) {
  const keyboard = new InlineKeyboard();

  VPN_PLANS.forEach((plan) => {
    keyboard
      .text(`${plan.name} - $${plan.price}`, selectPlan.pack({ planId: plan.id }))
      .row();
  });

  await ctx.reply("📊 Choose a VPN plan:", {
    reply_markup: keyboard,
  });
}











// export function BuyServiceHandler(ctx :any) {
//   // Show plans
//   bot.on("callback_query", async (ctx) => {
//     const keyboard = new InlineKeyboard();

//     VPN_PLANS.forEach((plan) => {
//       keyboard
//         .text(
//           `${plan.name} - $${plan.price}`,
//           selectPlan.pack({ planId: plan.id })
//         )
//         .row();
//     });

//     await ctx.editText("📊 Choose a VPN plan:", {
//       reply_markup: keyboard,
//     });
//   });

//   // Handle plan selection

//   bot.callbackQuery(selectPlan, async (ctx) => {
//     const plan = VPN_PLANS.find((p) => p.id === ctx.queryData.planId);

//     if (!plan) {
//       await ctx.answerCallbackQuery({ text: "Invalid plan selection" });
//       return;
//     }

//     const paymentInfo = `
// 💳 *Payment Instructions*
// Plan: ${plan.name}
// Traffic: ${plan.trafficGB === 999 ? "Unlimited" : `${plan.trafficGB}GB`}
// Duration: ${plan.duration} days
// Amount: $${plan.price}

// 1. Send $${plan.price} to:
//    💳 Card: \`1234 5678 9012 3456\`
//    👤 Name: YOUR NAME
//    🏦 Bank: YOUR BANK

// 2. Take a screenshot of the payment receipt
// 3. Upload the receipt here`;

//     await bot.api.editMessageText({
//       text: paymentInfo,
//       parse_mode: "Markdown",
//       reply_markup: new InlineKeyboard().text(
//         "↩️ Back to plans",
//         backToPlans.pack("↩️ Back to plans")
//       ),
//     });

//     const session = getSession(ctx);

//     // Set user state to waiting for receipt
//     session.waitingForReceipt = {
//       planId: plan.id.toString(),
//       startedAt: Date.now(),
//     };
//   });

//   // Handle back to plans
//   bot.callbackQuery(backToPlans, async (ctx) => {
//     const keyboard = new InlineKeyboard();

//     VPN_PLANS.forEach((plan) => {
//       keyboard
//         .text(
//           `${plan.name} - $${plan.price}`,
//           selectPlan.pack({ planId: plan.id })
//         )
//         .row();
//     });

//     await bot.api.editMessageText({
//       text: "📊 Choose a VPN plan:",
//       reply_markup: keyboard,
//     });
//   });

//   // Handle receipt upload
//   bot.on("message", async (ctx) => {
//     const session = getSession(ctx);

//     if (!session.waitingForReceipt) return;

//     const { planId } = session.waitingForReceipt;
//     const plan = VPN_PLANS.find((p) => p.id === Number(planId));

//     if (!plan) {
//       await ctx.send("Plan no longer available");
//       return;
//     }

//     // Get file_id of the best quality photo
//     const fileId = ctx.photo
//       ? ctx.photo[ctx.photo.length - 1]?.fileId
//       : ctx.document?.fileId;

//     if (!fileId) {
//       await ctx.reply("❌ Please send a valid image or document");
//       return;
//     }

//     // Find or create user
//     const user = await prisma.user.upsert({
//       where: { telegramId: ctx.from?.id },
//       create: {
//         telegramId: ctx.from?.id || BigInt(0),
//         firstName: ctx.from?.firstName || "",
//         username: ctx.from?.username || "",
//       },
//       update: {},
//     });

//     // Save payment to database
//     const payment = await prisma.payment.create({
//       data: {
//         userId: user.id,
//         planId: plan.id,
//         amount: plan.price,
//         receipt: fileId,
//         status: "pending",
//       },
//     });

//     // Notify admin
//     const adminKeyboard = new InlineKeyboard()
//       .text("✅ Confirm", `confirm-payment:${payment.id}`)
//       .text("❌ Reject", `reject-payment:${payment.id}`);

//     // ctx.sendPhoto(fileId)

//     await bot.api.sendPhoto({
//       chat_id: process.env.ADMIN_CHAT_ID!,
//       photo: fileId,
//       caption:
//         `⚠️ New Payment Review\n\n` +
//         `👤 User: ${ctx.from?.firstName || ""} (@${
//           ctx.from?.username || "no-username"
//         })\n` +
//         `🆔 ID: ${ctx.from?.id}\n` +
//         `📋 Plan: ${plan.name}\n` +
//         `📦 Traffic: ${plan.trafficGB}GB\n` +
//         `⏳ Duration: ${plan.duration} days\n` +
//         `💰 Amount: $${plan.price}\n` +
//         `📝 Payment ID: ${payment.id}`,
//       reply_markup: adminKeyboard,
//     });

//     // Reset user state
//     session.waitingForReceipt = undefined;
//     await ctx.reply(
//       "📨 Receipt received! We'll verify and activate your account shortly."
//     );
//   });
// }



// export async function handlePaidPlanRequest(ctx: MessageContext<Bot>) {
//   const telegramId = ctx.from?.id;
//   if (!telegramId) return ctx.reply("❌ Unable to get Telegram ID.");

//   // Fetch or create user
//   let user = await prisma.user.findUnique({ where: { telegramId } });
//   if (!user) {
//     user = await prisma.user.create({
//       data: {
//         telegramId,
//         username: ctx.from?.username,
//         firstName: ctx.from?.firstName,
//       },
//     });
//   }

//   // Show plans menu
//   const keyboard = new InlineKeyboard();
//   VPN_PLANS.forEach((plan) => {
//     keyboard
//       .text(
//         `${plan.name} - $${plan.price}`,
//         selectPlan.pack({ planId: plan.id })
//       )
//       .row();
//   });

//   await ctx.reply("📊 Choose a VPN plan:", {
//     reply_markup: keyboard,
//   });
// }

// export async function handlePlanSelection(ctx: CallbackQueryContext<Bot>) {
//   if (!ctx.queryData) throw new Error("No callback data");
//   const planId = selectPlan.unpack(ctx.queryData).planId;
//   const plan = VPN_PLANS.find((p) => p.id === planId);
//   if (!plan)
//     return ctx.autoAnswerCallbackQuery({ text: "Invalid plan selection" });

//   const paymentInfo = `
// 💳 *Payment Instructions*
// Plan: ${plan.name}
// Traffic: ${plan.trafficGB === 999 ? "Unlimited" : `${plan.trafficGB}GB`}
// Duration: ${plan.duration} days
// Amount: $${plan.price}

// 1. Send $${plan.price} to:
//    💳 Card: \`1234 5678 9012 3456\`
//    👤 Name: YOUR NAME
//    🏦 Bank: YOUR BANK

// 2. Take a screenshot of the payment receipt
// 3. Upload the receipt here`;

//   await ctx.editMessageText(paymentInfo, {
//     parse_mode: "Markdown",
//     reply_markup: new InlineKeyboard().text(
//       "↩️ Back to plans",
//       backToPlans.pack({})
//     ),
//   });

//   // Set session state
//   const session = getSession(ctx);
//   session.waitingForReceipt = {
//     planId: plan.id.toString(),
//     startedAt: Date.now(),
//   };
// }

// export async function handleReceiptUpload(ctx: MessageContext<Bot>) {
//   const session = getSession(ctx);
//   if (!session.waitingForReceipt) return;

//   const { planId } = session.waitingForReceipt;

//   const plan = VPN_PLANS.find((p) => p.id === Number(planId));
//   if (!plan) return ctx.reply("Plan no longer available");

//   const fileId =
//     ctx.photo?.[ctx.photo.length - 1]?.fileId || ctx.document?.fileId;
//   if (!fileId) return ctx.reply("❌ Please send a valid image or document");

//   if (!ctx.from) {
//     return ctx.reply("Unable to identify your account.");
//   }
  

//   // Create payment record
//   const payment = await prisma.payment.create({
//     data: {
//       userId: ctx.from.id,
//       planId: plan.id,
//       amount: plan.price,
//       receipt: fileId,
//       status: "pending",
//     },
//   });

//   // Notify admin
//   const adminKeyboard = new InlineKeyboard()
//     .text("✅ Confirm", `confirm-payment:${payment.id}`)
//     .text("❌ Reject", `reject-payment:${payment.id}`);

//   await ctx.bot.api.sendPhoto({
//     chat_id: process.env.ADMIN_CHAT_ID!,
//     photo: fileId,
//     caption: `⚠️ New Payment Review\n\nUser: @${ctx.from.username}\nPlan: ${plan.name}\nAmount: $${plan.price}`,
//     reply_markup: adminKeyboard,
//   });

//   // Cleanup
//   session.waitingForReceipt = undefined;
//   await ctx.reply("📨 Receipt received! We'll verify your payment shortly.");
// }
