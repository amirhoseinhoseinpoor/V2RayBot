// handlers/mainMenu/aboutUs.ts
import { MessageContext } from "gramio";
import { type Bot } from "gramio";

export const freeAccountHandler = (ctx: MessageContext<Bot>) => {
  return ctx.reply("این بخش در حال توسعه است. لطفاً به زودی مراجعه کنید.");
};
