// shared/keyboards/mainMenu.ts
import { Keyboard } from "gramio";

export const mainMenuKeyboard = new Keyboard()
  .text("📦 خرید سرویس")
  .text("🔎 اکانت رایگان")
  .row()
  .text("🛠 پشتیبانی")
  .text("👨‍🏫 اموزش اتصال")
  .resized(); // makes it fit nicely
