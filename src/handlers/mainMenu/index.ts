import { Bot } from "gramio";
import { freeAccountHandler } from "./freeAccount.js";
import { SupportHandler } from "./support.js";
import { BuyServiceHandler } from "./buyService.js";

export function registerMenuHandlers(bot: Bot) {
  bot.hears("📦 خرید سرویس", BuyServiceHandler);
  bot.hears("🔎 اکانت رایگان", freeAccountHandler);
  bot.hears("🛠 پشتیبانی", SupportHandler);
}
