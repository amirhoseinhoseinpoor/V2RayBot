import Fastify from "fastify"
import { config } from "./config.js"
import { bot } from "./bot.js"
import { webhookHandler } from "gramio"

export const fastify = Fastify()

fastify.post(`/${config.BOT_TOKEN}`, webhookHandler(bot, "fastify"))
