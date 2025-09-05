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
    `🎁 لینک دعوت اختصاصی شما:👇\n\n${referralLink}\n\n` +
      `شما میتونید به ازای هر سه نفر که با لینک شما بیان داخل ربات و اکانت بخرن یه وی پی ان رایگان یک ماهه 25 گیگ هدیه دریافت کنید . \n اینجوری میتونید هر وقت بخواید دکمه زیر بزنید و اکانتتون رو بگیرید تا اون موقع جاش پیش ما امنه 🙂\n\n` +
      `👤 شما تا کنون ${user.referralCount}  نفر را دعوت کرده‌اید که خرید کرده اند.\n\n` +
      `🔗 لینک خود را با دوستانتان به اشتراک بگذارید و از هدیه‌های رایگان بهره‌مند شوید!`,
    {
      reply_markup: keyboard,
    }
  );
}
