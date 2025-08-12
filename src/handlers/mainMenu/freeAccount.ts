import { prisma } from "./../../db/index.js";
import { generateConfig } from "../../services/configGenerate/generateConfig.js";
import { MessageContext } from "gramio";
import { Bot } from "gramio";
import { addDays } from "date-fns";

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

 const trafficLimit = BigInt(Math.floor(0.3 * 1024 * 1024 * 1024));

  const expiresAt = addDays(new Date(), 1);

  await prisma.vPN.create({
    data: {
      email,
      uuid,
      alterId,
      userId: user.id,
      type: "free",
      trafficLimit: trafficLimit,
      expiredAt: expiresAt
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
