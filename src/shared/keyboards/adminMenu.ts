import { InlineKeyboard } from "gramio";

export const adminMenuKeyboard = new InlineKeyboard()
  .text("📢 ارسال پیام به کاربر", "admin_send_message")
  .text("📢 ارسال به همه", "send_to_all")
  .row()
  .text("⬅️ بازگشت", "back_to_main");


export const cancelKeyboard = new InlineKeyboard().text("❌ لغو", "admin_cancel");