import { InlineKeyboard } from "gramio";
import { confirmPayment, rejectPayment } from "../callback-data/buyVPN.js";

export function paymentAdminKeyboard(
  paymentId: number,
  holdOver: boolean,
  vpnId: number
) {
  return new InlineKeyboard()
    .text("✅ تایید", confirmPayment.pack({ paymentId, holdOver:holdOver , vpnId : vpnId }))
    .text("❌ رد", rejectPayment.pack({ paymentId }));
}
