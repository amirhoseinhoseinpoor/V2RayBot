import { Bot } from "gramio";
import { handleFreeAccountRequest } from "./freeAccount.js";
import { SupportHandler } from "./support.js";
import { BuyServiceHandler } from "./buyService.js";

export function registerMenuHandlers(bot: Bot) {
  bot.hears("📦 خرید سرویس", BuyServiceHandler);
  bot.hears("🔎 اکانت رایگان", handleFreeAccountRequest);
  bot.hears("🛠 پشتیبانی", SupportHandler);
}
