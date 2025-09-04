import { Bot, MessageContext, InlineKeyboard } from "gramio";
import { prisma } from "../../db/index.js";

export async function FreeGiftServicesHandler(ctx: MessageContext<Bot>) {


  const tgUser = ctx.from;
  if (!tgUser) return;

  const user = await prisma.user.findUnique({
    where: { telegramId: tgUser.id },
  });

  if (!user) return ctx.send("❌ کاربر یافت نشد.");

  const referralLink = `https://t.me/VIPV2RayNG_config_bot?start=ref${ctx.from.id}`;

  const keyboard = new InlineKeyboard().text(
    "🎉 دریافت اکانت جایزه",
    `claim_reward_${user.telegramId}`
  );
  

  await ctx.send(
    `🎁 لینک دعوت اختصاصی شما:\n\n${referralLink}\n\n` +
      `برای هر 3 نفر که با لینک شما وارد ربات شوند و اولین خرید را انجام دهند، یک اکانت 25GB رایگان دریافت می‌کنید. یعنی اگه 6 نفر با لینک شما عضو شوند و خرید کنند، شما 2 اکانت 25GB رایگان دریافت می‌کنید!\n\n` +
    //   `👤 شما تا کنون ${user.referredCount} نفر را دعوت کرده‌اید.\n\n` +
      `🔗 لینک خود را با دوستانتان به اشتراک بگذارید و از هدیه‌های رایگان بهره‌مند شوید!`,
    {
      reply_markup: keyboard,
    }
  );
}
