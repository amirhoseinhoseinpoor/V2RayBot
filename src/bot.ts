import { Bot } from "gramio";
import { config } from "./config.js";
import { InlineKeyboard } from "gramio";
import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query";
import { autoRetry } from "@gramio/auto-retry";
import { mediaCache } from "@gramio/media-cache";
import { session } from "@gramio/session";
import { scenes } from "@gramio/scenes";
import { greetingScene } from "./scenes/greeting.js";
import { paginationFor } from "@gramio/pagination/plugin";
import { redisStorage } from "@gramio/storage-redis";
import { redis } from "./services/redis.js";
// handler
import { registerMenuHandlers } from "./handlers/mainMenu/index.js";
// import keyboards
import { mainMenuKeyboard } from "./shared/keyboards/mainMenu.js";

if (redis.status !== "ready" && redis.status !== "connecting") {
  await redis.connect();
}

const storage = redisStorage(redis);

export const bot = new Bot(config.BOT_TOKEN)
  .extend(autoAnswerCallbackQuery())
  .extend(autoRetry())
  .extend(mediaCache())
  .extend(session({ storage }))
  .extend(
    scenes([greetingScene], {
      storage,
    })
  )
  .extend(paginationFor([]));

registerMenuHandlers(bot);

bot
  .command("start", (ctx) => {
    const name = ctx.from?.firstName || "کاربر";

    return ctx.send(
      `🎉 سلام کاربر ${name} به ربات خوش آمدید\n \n ▫️ارائه کانفیگ های اختصاصی پرسرعت با پشتیبانی\n \n ▫️قابل استفاده بر روی چند دستگاه هم زمان\n\n ▫️قابل استفاده بر روی : \n\n ▫️اندروید\n ▫️ایفون\n ▫️ویندوز\n\n\n 📣کانال اطلاعیه : @v2raychannel \n\n 👤 پشتیبانی تمام وقت : @sfsdfawkdfksd \n\n\n`,
      {
        reply_markup: mainMenuKeyboard,
      }
    );
  })

  .onStart(({ info }) => console.log(`✨ Bot ${info.username} was started!`));

bot.start().catch((err) => {
  console.error("❌ Bot failed to start:", err);
  process.exit(1);
});
