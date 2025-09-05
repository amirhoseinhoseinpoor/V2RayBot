import { Bot } from "gramio";
import { handleFreeAccountRequest } from "./freeAccount.js";
import { SupportHandler } from "./support.js";
import { BuyServiceHandler } from "./buyService.js";
import { TeachUserHandler } from "./teachUserHandler.js";
import { ActiveServicesHandler } from "./activeServices.js";
import { FreeGiftServicesHandler } from "./freeGiftService.js";

export function registerMenuHandlers(bot: Bot) {
  bot.hears("📦 خرید سرویس", BuyServiceHandler(false, 0));
  bot.hears("🔎 اکانت رایگان", handleFreeAccountRequest);
  bot.hears("🛠 پشتیبانی", SupportHandler);
  bot.hears("👨‍🏫 اموزش اتصال", TeachUserHandler);
  bot.hears("📡 سرویس های فعال من", ActiveServicesHandler);
  bot.hears("⏰ تمدید اشتراک" , ActiveServicesHandler);
  bot.hears("🎁 دریافت جایزه vpn یک ماهه 25 گیگ رایگان" , FreeGiftServicesHandler);
}
