import { InlineKeyboard } from "gramio";
import { confirmPayment, rejectPayment } from "../callback-data/buyVPN.js";

export function paymentAdminKeyboard(paymentId: number) {
  return new InlineKeyboard()
    .text("✅ Confirm", confirmPayment.pack({ paymentId }))
    .text("❌ Reject", rejectPayment.pack({ paymentId }));
}
