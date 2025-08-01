import { InlineKeyboard } from "gramio";
import { confirmPayment, rejectPayment } from "../callback-data/buyVPN.js";

export function paymentAdminKeyboard(paymentId: number) {
  return new InlineKeyboard()
    .text("✅ تایید", confirmPayment.pack({ paymentId }))
    .text("❌ رد", rejectPayment.pack({ paymentId }));
}
