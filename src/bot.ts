import { Bot } from "gramio";
import { config } from "./config.js";
import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query";
import { autoRetry } from "@gramio/auto-retry";
import { mediaCache } from "@gramio/media-cache";
import { session } from "@gramio/session";
import { scenes } from "@gramio/scenes";
import { greetingScene } from "./scenes/greeting.js";
import { paginationFor } from "@gramio/pagination/plugin";
import { redisStorage } from "@gramio/storage-redis";
import { redis } from "./services/redis.js";
import { prisma } from "./db/index.js";

// handler
import { registerMenuHandlers } from "./handlers/mainMenu/index.js";
import { registerBuyServiceHandlers } from "./handlers/mainMenu/registerBuyService.js";
import { registerAdminHandlers } from "./handlers/admin/registerAdmin.js";
import { registerActiveServiceHandlers } from "./handlers/mainMenu/registerActiveService.js";
import { sendChatToUserHandler } from "./handlers/admin/sendChatToUser.js";
// bot message
import { handleAdminMessage } from "./handlers/admin/sendChatToUser.js";
import { handleBuyReceiptMessage } from "./handlers/mainMenu/registerBuyService.js";
// import keyboards
import { mainMenuKeyboard } from "./shared/keyboards/mainMenu.js";
import { adminMenuKeyboard } from "./shared/keyboards/adminMenu.js";
// import services
import { findOrCreateUser } from "./services/mainServices/user.js";

if (redis.status !== "ready" && redis.status !== "connecting") {
  await redis.connect();
}

const storage = redisStorage(redis);

export const bot = new Bot(config.BOT_TOKEN)
  .extend(autoAnswerCallbackQuery())
  .extend(autoRetry())
  .extend(mediaCache())
  .extend(
    session({
      key: "sessionKey",
      initial: () => ({}),
    })
  )
  .extend(
    scenes([greetingScene], {
      storage,
    })
  )
  .extend(paginationFor([]));

bot
  .command("start", async (ctx) => {
    const tgUser = ctx.from;

    if (!tgUser) return;

    const text = ctx.text || "";
    const parts = text.split(" ");
    const args = parts.length > 1 ? parts.slice(1).join(" ") : null;

    // check if user already exists
    let user = await prisma.user.findUnique({
      where: { telegramId: tgUser.id },
    });

    const isNewUser = !user;

    await findOrCreateUser(tgUser);

    if (isNewUser) {
      // if this new user came with referral code
      if (args && args.startsWith("ref")) {
        const referrerId = parseInt(args.replace("ref", ""), 10);

        if (referrerId !== tgUser.id) {
          await prisma.user.update({
            where: { telegramId: tgUser.id },
            data: { referredBy: referrerId },
          });

          // notify referrer (optional)
          await bot.api.sendMessage({
            chat_id: referrerId,
            text: `🎉 کاربر جدیدی با لینک شما به ربات پیوست! بعد از خرید کاربر به لیست افراد معرفی شده از طریق شما اضافه میشود و به ازای هر سه نفر یک وی پی ان رایگان یک ماهه 25 گیگ رایگان دریافت میکنید`,
          });
        }
      }
    }

    const name = ctx.from?.firstName || "کاربر";

    const keyboard =
      tgUser.id === parseInt(process.env.ADMIN_CHAT_ID!)
        ? adminMenuKeyboard
        : mainMenuKeyboard;

    return ctx.send(
      `🎉 سلام کاربر ${name} به ربات خوش آمدید\n \n ▫️ارائه کانفیگ های اختصاصی پرسرعت با پشتیبانی\n \n ▫️قابل استفاده بر روی چند دستگاه هم زمان\n\n ▫️قابل استفاده بر روی : \n\n ▫️اندروید\n ▫️ایفون\n ▫️ویندوز\n\n\n 📣کانال اطلاعیه : @VIPV2RayNG_config \n\n 👤 پشتیبانی تمام وقت : @VIPV2RayNG_config_S \n\n\n`,
      {
        reply_markup: keyboard,
      }
    );
  })

  .onStart(({ info }) => console.log(`✨ Bot ${info.username} was started!`));

registerMenuHandlers(bot);
registerBuyServiceHandlers(bot);
registerAdminHandlers(bot);
sendChatToUserHandler(bot);
registerActiveServiceHandlers(bot);

bot.on("message", async (ctx) => {
  const handledBuy = await handleBuyReceiptMessage(ctx, bot);
  if (handledBuy) return;

  const handledByAdmin = await handleAdminMessage(ctx, bot);
  if (handledByAdmin) return;

  await ctx.send("❗ پیام شما پردازش نشد.");
});

// bot.start().catch((err) => {
//   console.error("❌ Bot failed to start:", err);
//   process.exit(1);
// });
