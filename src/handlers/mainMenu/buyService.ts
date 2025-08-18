import {
  InlineKeyboard,
} from "gramio";
import { VPN_PLANS } from "../../constants/plans.js";
import { selectPlan } from "../../shared/callback-data/buyVPN.js";

// export async function BuyServiceHandler(
//   ctx: any,
//   holdOver: boolean,
//   vpnId: number
// ) {
//   const keyboard = new InlineKeyboard();

//   VPN_PLANS.forEach((plan) => {
//     keyboard
//       .text(
//         `${plan.name} - ${plan.price}T`,
//         selectPlan.pack({ planId: plan.id, holdOver: holdOver, vpnId: vpnId })
//       )
//       .row();
//   });

//   await ctx.reply("📊  وی پی ان مورد نظر خود را انتخاب کنید:", {
//     reply_markup: keyboard,
//   });
// }

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

    // Use sendMessage for callback support
    // await bot.api.sendMessage({
    //   chat_id: ctx.chat.id,
    //   text: "📊 وی پی ان مورد نظر خود را انتخاب کنید:",
    //   reply_markup: keyboard,
    // });

    await ctx.send("📊  وی پی ان مورد نظر خود را انتخاب کنید:", {
      reply_markup: keyboard,
    });
  };
}
