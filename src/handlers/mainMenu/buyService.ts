// handlers/mainMenu/buyService.ts
import { MessageContext } from "gramio";
import { type Bot } from "gramio";


export const BuyServiceHandler = (ctx: MessageContext<Bot>) => {
return ctx.reply("🛍 بخش خرید سرویس در حال توسعه است.");
};




