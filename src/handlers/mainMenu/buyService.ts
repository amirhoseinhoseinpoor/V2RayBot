import {
  InlineKeyboard,
} from "gramio";
import { VPN_PLANS } from "../../constants/plans.js";
import { selectPlan } from "../../shared/callback-data/buyVPN.js";

export function BuyServiceHandler(holdOver: boolean, vpnId: number) {
  return async (ctx: any) => {
    const keyboard = new InlineKeyboard();

    VPN_PLANS.forEach((plan) => {
      keyboard
        .text(
          `${plan.name} - ${plan.price}T`,
          selectPlan.pack({ planId: plan.id, holdOver, vpnId })
        )
        .row();
    });


    await ctx.send("📊  وی پی ان مورد نظر خود را انتخاب کنید:", {
      reply_markup: keyboard,
    });
  };
}
