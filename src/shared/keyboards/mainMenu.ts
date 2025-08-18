// shared/keyboards/mainMenu.ts
import { Keyboard } from "gramio";

export const mainMenuKeyboard = new Keyboard()
  .text("📦 خرید سرویس")
  .text("🔎 اکانت رایگان")
  .row()
  .text("📡 سرویس های فعال من")
  .text("⏰ تمدید اشتراک")
  .row()
  .text("🛠 پشتیبانی")
  .text("👨‍🏫 اموزش اتصال")
  .resized();

export const mainMenuKeyboardNoFree = new Keyboard()
  .text("📦 خرید سرویس")
  .row()
  .text("📡 سرویس های فعال من")
  .text("⏰ تمدید اشتراک")
  .row()
  .text("🛠 پشتیبانی")
  .text("👨‍🏫 اموزش اتصال")
  .resized();
