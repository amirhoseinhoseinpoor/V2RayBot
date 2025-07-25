import { MessageContext } from "gramio";
import { type Bot } from "gramio";

export const SupportHandler = (ctx: MessageContext<Bot>) => {
  return ctx.reply("لطفا به پشتیبانی ما پیام دهید:\n@SupportChannel", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "📩 ارتباط با پشتیبانی", url: "https://t.me/SupportChannel" }],
      ],
    },
  });
};
