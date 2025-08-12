import { prisma } from "./../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { MessageContext, Bot } from "gramio";
import { addDays } from "date-fns";
import { mainMenuKeyboardNoFree, mainMenuKeyboard } from "../../shared/keyboards/mainMenu.js";

export async function handleFreeAccountRequest(ctx: MessageContext<Bot>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return ctx.reply("❌ Unable to get Telegram ID.");

  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramId),
        username: ctx.from?.username,
        firstName: ctx.from?.firstName,
      },
    });
  }

  if (user.freeAccount) {
    return ctx.reply("❌ شما قبلاً از حساب رایگان استفاده کرده‌اید.", {
      reply_markup: mainMenuKeyboardNoFree,
    });
  }

  await ctx.reply("⏳ لطفا صبر کنید...", {
    reply_markup: mainMenuKeyboardNoFree,
  });

  try {
    const { config, email, uuid, alterId } = await generateConfig({
      telegramId: BigInt(telegramId),
      accountType: "free",
      name: ctx.from?.username,
    });

    const trafficLimit = BigInt(Math.floor(0.3 * 1024 * 1024 * 1024));
    const expiresAt = addDays(new Date(), 1);

    await prisma.vPN.create({
      data: {
        email,
        uuid,
        alterId,
        userId: user.id,
        type: "free",
        trafficLimit,
        expiredAt: expiresAt,
      },
    });

    await prisma.user.update({
      where: { telegramId },
      data: { freeAccount: true },
    });

    return ctx.reply(
      `✅ حساب رایگان شما با موفقیت ایجاد شد:\n\n<code>${config}</code>\n\n▫️یک روزه\n▫️300 مگابایت`,
      { parse_mode: "HTML", reply_markup: mainMenuKeyboardNoFree }
    );
  } catch (error) {
    console.error("Error in handleFreeAccountRequest:", error);
    return ctx.reply("❌ خطایی رخ داد. لطفا دوباره تلاش کنید.", {
      reply_markup: mainMenuKeyboard,
    });
  }
}
