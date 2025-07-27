
import cron from "node-cron";
import { collectHourlyTraffic } from "./collectHourlyTraffic.js";
import { cleanExpiredVPNs } from "./cleanExpiredVPNs.js";
import { cleanTrafficLimit } from "./cleanTrafficLimit.js";

// hourly traffic collection cron job and reset stats
cron.schedule("0 * * * *", async () => {
  console.log("⏰ Collecting hourly traffic...");
  await collectHourlyTraffic();
});

// hourly clean expired VPNs cron job
// This will run every hour at the 10th minute
cron.schedule("10 * * * *", async () => {
  console.log("🧹 Cleaning expired VPNs...");
  await cleanExpiredVPNs();
});

// hourly clean traffic limit cron job
// This will run every hour at the 20th minute
cron.schedule("20 * * * *", async () => {
  console.log("🧹 Cleaning traffic limits...");
  await cleanTrafficLimit();
});