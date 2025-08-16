import { InlineKeyboard , Bot , ContextType} from "gramio";
import { prisma } from "../../db/index.js";
import { cancelKeyboard } from "../../shared/keyboards/adminMenu.js";


// State storage for admin message process
const adminStates: Record<number, { step: string; targetId?: number }> = {};

export function sendChatToUserHandler(bot: Bot) {
  // Show admin menu
  bot.command("admin", async (ctx) => {
    if (!process.env.ADMIN_CHAT_ID) {
      return ctx.send("❌ you are not the admin.");
    }

    if (ctx.from?.id !== parseInt(process.env.ADMIN_CHAT_ID))
      return ctx.send("❌ Not authorized.");

    const keyboard = new InlineKeyboard()
      .text("📢 Send Custom Message", "admin_send_message")
      .row()
      .text("📢 Send to All Users", "send_to_all"); // 🆕 New button

    await ctx.send("🔧 Admin Panel", { reply_markup: keyboard });
  });

  bot.callbackQuery("send_to_all", async (ctx) => {
    if (!process.env.ADMIN_CHAT_ID) {
      return ctx.send("❌ you are not the admin.");
    }
    if (ctx.from?.id !== parseInt(process.env.ADMIN_CHAT_ID))
      return ctx.answerCallbackQuery({
        text: "❌ Not authorized.",
        show_alert: true,
      });

    adminStates[ctx.from.id] = { step: "ask_broadcast_message" };
    await ctx.send("✏️ لطفاً متن پیام را وارد کنید:", {
      reply_markup: cancelKeyboard,
    });
    await ctx.answerCallbackQuery();
  });

  // Step 1: Ask for user ID
  bot.callbackQuery("admin_send_message", async (ctx) => {
    if (!process.env.ADMIN_CHAT_ID) {
      return ctx.send("❌ you are not the admin.");
    }

    if (ctx.from?.id !== parseInt(process.env.ADMIN_CHAT_ID))
      return ctx.answerCallbackQuery({
        text: "❌ Not authorized.",
        show_alert: true,
      });

    adminStates[ctx.from.id] = { step: "ask_user_id" };
    await ctx.send("🆔 ایدی تلگرام مورد نظر را وارد کنید", {
      reply_markup: cancelKeyboard,
    });
    await ctx.answerCallbackQuery();
  });

  // Cancel button handler
  bot.callbackQuery("admin_cancel", async (ctx) => {
    if (!process.env.ADMIN_CHAT_ID) {
      return ctx.send("❌ you are not the admin.");
    }

    const adminId = ctx.from?.id;
    if (!adminId || adminId !== parseInt(process.env.ADMIN_CHAT_ID)) return;

    delete adminStates[adminId];

    if (ctx.message) {
      // Delete the "Please enter message" prompt
      try {
        await bot.api.deleteMessage({
          chat_id: ctx.message.chat.id!,
          message_id: ctx.message.id!,
        });
      } catch (e) {
        console.error("Failed to delete prompt:", e);
      }
    }

    await ctx.answerCallbackQuery({ text: "❌ عملیات لغو شد" });
  });

  // Step 2 & 3: Handle admin replies
  // bot.on("message", async (ctx) => {
  //   console.log("Message text:", ctx.text);

  //   if (!process.env.ADMIN_CHAT_ID) {
  //     return ctx.send("❌ you are not the admin.");
  //   }

  //   console.log("first");

  //   if (ctx.from?.id !== parseInt(process.env.ADMIN_CHAT_ID)) return; // Only admin replies handled

  //   console.log("secon");

  //   const state = adminStates[ctx.from.id];
  //   if (!state) return; // No active admin flow

  //   if (state.step === "ask_broadcast_message") {
  //     const messageText = ctx.text;
  //     if (!messageText) {
  //       return ctx.send("❌ Message cannot be empty.");
  //     }

  //     delete adminStates[ctx.from.id];

  //     const users = await prisma.user.findMany({
  //       select: { telegramId: true },
  //     });

  //     let sentCount = 0;
  //     for (const user of users) {
  //       try {
  //         await bot.api.sendMessage({
  //           chat_id: user.telegramId.toString(),
  //           text: messageText,
  //         });
  //         sentCount++;
  //       } catch (err) {
  //         console.error(`Failed to send to ${user.telegramId}`, err);
  //       }
  //     }

  //     return ctx.send(`✅ Broadcast sent to ${sentCount} users.`);
  //   }

  //   if (state.step === "ask_user_id") {
  //     const inputText = ctx.text?.trim();

  //     console.log("Message text:", ctx.text);

  //     if (!inputText) {
  //       return ctx.send("❌ Invalid ID. Please enter a number.");
  //     }

  //     const targetId = parseInt(inputText);

  //     if (isNaN(targetId)) {
  //       return ctx.send("❌ Invalid ID. Please enter a number.");
  //     }

  //     adminStates[ctx.from.id] = { step: "ask_message", targetId };
  //     return ctx.send("✏️ لطفاً متن پیام را وارد کنید:", {
  //       reply_markup: cancelKeyboard,
  //     });
  //   }

  //   if (state.step === "ask_message" && state.targetId) {
  //     const messageText = ctx.text;

  //     if (!messageText) {
  //       return ctx.send("❌ Message cannot be empty.");
  //     }

  //     try {
  //       await bot.api.sendMessage({
  //         chat_id: state.targetId,
  //         text: messageText,
  //       });
  //       await ctx.send(`✅ Message sent to **${state.targetId}**`);
  //     } catch (err) {
  //       await ctx.send(`❌ Failed to send message to ${state.targetId}`);
  //       console.error(err);
  //     }
  //     delete adminStates[ctx.from.id]; // Clear state
  //   }
  // });
}

export async function handleAdminMessage(ctx: ContextType<Bot, "message"> , bot : Bot): Promise<boolean> {
  if (!isAdmin(ctx)) return false;

  const state = adminStates[ctx.from!.id];
  if (!state || !ctx.text) return false;

  const text = ctx.text.trim();

  if (state.step === "ask_broadcast_message") {
    delete adminStates[ctx.from!.id];
    const users = await prisma.user.findMany({ select: { telegramId: true } });

    let sent = 0;
    for (const user of users) {
      try {
        await bot.api.sendMessage({ chat_id: user.telegramId.toString(), text });
        sent++;
      } catch (err) {
        console.error("Send failed:", user.telegramId, err);
      }
    }

    await ctx.send(`✅ Broadcast sent to ${sent} users.`);
    return true;
  }

  if (state.step === "ask_user_id") {
    const id = parseInt(text);
    if (isNaN(id)) {
      await ctx.send("❌ Invalid ID.");
      return true;
    }

    adminStates[ctx.from!.id] = { step: "ask_message", targetId: id };
    await ctx.send("✏️ لطفاً متن پیام را وارد کنید:", {
      reply_markup: cancelKeyboard,
    });
    return true;
  }

  if (state.step === "ask_message" && state.targetId) {
    try {
      await bot.api.sendMessage({
        chat_id: state.targetId,
        text,
      });
      await ctx.send(`✅ Message sent to ${state.targetId}`);
    } catch (e) {
      await ctx.send(`❌ Failed to send message.`);
    }

    delete adminStates[ctx.from!.id];
    return true;
  }

  return false;
}

function isAdmin(ctx: ContextType<Bot, "message">): boolean {
  return (
    typeof process.env.ADMIN_CHAT_ID === "string" &&
    ctx.from?.id === parseInt(process.env.ADMIN_CHAT_ID)
  );
}
