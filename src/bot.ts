import { Bot } from "gramio"
import { config } from "./config.ts"
import { autoAnswerCallbackQuery } from "@gramio/auto-answer-callback-query"
import { autoRetry } from "@gramio/auto-retry"
import { mediaCache } from "@gramio/media-cache"
import { session } from "@gramio/session"
import { scenes } from "@gramio/scenes"
import { greetingScene } from "./scenes/greeting.ts"
import { paginationFor } from "@gramio/pagination/plugin"
import { redisStorage } from "@gramio/storage-redis"
import { redis } from "./services/redis.ts"

const storage = redisStorage(redis);

export const bot = new Bot(config.BOT_TOKEN)
.extend(autoAnswerCallbackQuery())
.extend(autoRetry())
.extend(mediaCache())
.extend(session())
.extend(scenes([greetingScene], {
			storage
		}))
.extend(paginationFor([]))
    .command("start", (context) => context.send("Hi!"))
    .onStart(({ info }) => console.log(`✨ Bot ${info.username} was started!`));