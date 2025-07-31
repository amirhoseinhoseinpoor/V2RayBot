// shared/callback-data/mainMenu.ts
// export const CALLBACKMainMenue = {
//   BUY_SERVICE: "buy_service",
//   ABOUT_US: "about_us",
//   SUPPORT: "support",
// };
import { InlineKeyboard } from "gramio";
import { buyVPN } from "./buyVPN.js";

export const mainMenuKeyboard = new InlineKeyboard()
    .text("Get Free Account", "free-account")
    .row()
    .text("My Accounts", "my-accounts")
    .text("Support", "support")
    .row();