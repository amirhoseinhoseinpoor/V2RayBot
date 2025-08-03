import { bot } from "./bot.js";
import { config } from "./config.js";
import { fastify } from "./webhook.js";
import "./cron/node-cron.js";

export async function startBot() {
  // Error handling first
  process.on("uncaughtException", (error) => {
    console.error("FATAL:", error);
    process.exit(1);
  });

  // Graceful shutdown
  const signals = ["SIGINT", "SIGTERM"] as const;
  signals.forEach(signal => process.on(signal, gracefulShutdown));

  // Start based on environment
  if (config.NODE_ENV === "production") {
    await startWebhookMode();
  } else {
    await startPollingMode();
  }
}

async function startWebhookMode() {
  await fastify.listen({ port: config.PORT, host: "0.0.0.0" });
  console.log(`Webhook listening on port ${config.PORT}`);
}

async function startPollingMode() {
  await bot.start({
    allowedUpdates: ["message", "callback_query"],
    dropPendingUpdates: true
  });
  console.log("Bot running in polling mode");
}

async function gracefulShutdown() {
  await fastify?.close();
  await bot.stop();
  process.exit(0);
}