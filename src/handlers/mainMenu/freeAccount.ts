import { prisma } from "./../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { MessageContext } from "gramio";
import { Bot } from "gramio";

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
    return ctx.reply("❌ شما قبلاً از حساب رایگان استفاده کرده‌اید.");
  }

  const { config, email, uuid, alterId } = await generateConfig({
    telegramId: BigInt(telegramId),
    accountType: "free",
    name: ctx.from?.username,
  });

  await prisma.vPN.create({
    data: {
      email,
      uuid,
      alterId,
      userId: user.id,
      type: "free", // mark it as free account
    },
  });

  await prisma.user.update({
    where: { telegramId },
    data: { freeAccount: true },
  });

  return ctx.send(
    `✅ حساب رایگان شما با موفقیت ایجاد شد: ( بزنید روش کپی میشه خودش )\n\n<code>${config}</code>\n\n ▫️یک روزه  \n ▫️300 مگابایت`,
    { parse_mode: "HTML" }
  );
}
