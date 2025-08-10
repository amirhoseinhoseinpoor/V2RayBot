import { InlineKeyboard } from "gramio";
import { MessageContext } from "gramio";
import { prisma } from "../../db/index.js";
import { Bot } from "gramio";

export async function ActiveServicesHandler(ctx: MessageContext<Bot>) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return ctx.reply("❌ Unable to get Telegram ID.");

  const user = await prisma.user.findUnique({
    where: {
      telegramId: BigInt(telegramId),
    },
    include: {
      vpns: {
        include: {
          plan: true,
        },
        where: {
          expired: false,
        },
      },
    },
  });

  if (!user || user.vpns.length === 0) {
    return ctx.reply("❌ شما هیچ سرویس فعالی ندارید.");
  }

  let message = "📡 سرویس های فعال شما:";

  const keyboard = new InlineKeyboard();

  user.vpns.forEach((vpn) => {
    let keyBoardText = vpn.email + `(${vpn.plan?.name || "بدون پلن"})`;
    keyboard.text(keyBoardText, `show_vpn_${vpn.id}`).row(); // Each VPN button has unique callback
  });

  //   keyboard.text("🔙 بازگشت به منوی اصلی", "main_menu");

  return ctx.send(message, { reply_markup: keyboard });
}
