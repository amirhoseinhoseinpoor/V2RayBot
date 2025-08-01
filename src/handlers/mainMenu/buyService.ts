

import { InlineKeyboard } from "gramio";

import { VPN_PLANS } from "../../constants/plans.js";
import {
  selectPlan,
} from "../../shared/callback-data/buyVPN.js";


export async function BuyServiceHandler(ctx: any) {
  const keyboard = new InlineKeyboard();

  VPN_PLANS.forEach((plan) => {
    keyboard
      .text(`${plan.name} - ${plan.price}T`, selectPlan.pack({ planId: plan.id }))
      .row();
  });

  await ctx.reply("📊  وی پی ان مورد نظر خود را انتخاب کنید:", {
    reply_markup: keyboard,
  });
}


