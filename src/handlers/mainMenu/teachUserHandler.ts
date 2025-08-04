import { MessageContext } from "gramio";
import { type Bot } from "gramio";

export const TeachUserHandler = (ctx: MessageContext<Bot>) => {
  return ctx.reply("برای دیدن نحوه اتصال کلیک کنید و سپس فیلم داخل کانال مشاهده کنید:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "نحوه اتصال",
            url: "https://t.me/VIPV2RayNG_config/3",
          },
        ],
      ],
    },
  });
};
