import { prisma } from './../../db/index.js';
import { generateFreeAccountConfig } from '../../services/configGenerate/freeConfig.js';
import { MessageContext } from "gramio";
import { type Bot } from "gramio";



export async function handleFreeAccountRequest(ctx: any) {
  const telegramId = ctx.from?.id.toString();
  if (!telegramId) return ctx.reply("❌ Unable to get Telegram ID.");

  let user = await prisma.user.findUnique({ where: { telegramId } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId,
        username: ctx.from?.username,
        firstName: ctx.from?.first_name
      },
    });
  }

  if (user.freeAccount) {
    return ctx.reply("❌ شما قبلاً از حساب رایگان استفاده کرده‌اید.");
  }

  const { config, email, uuid, alterId } = await generateFreeAccountConfig(telegramId);

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

  return ctx.reply(`✅ حساب رایگان شما با موفقیت ایجاد شد:\n\n${config}`);
}