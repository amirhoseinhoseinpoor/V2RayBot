
import cron from "node-cron";
import { collectHourlyTraffic } from "./collectHourlyTraffic.js";
import { cleanExpiredVPNs } from "./cleanExpiredVPNs.js";
import { cleanTrafficLimit } from "./cleanTrafficLimit.js";
// import { backupDatabase } from "./backupDatabase.js";


// hourly traffic collection cron job and reset stats
cron.schedule("01 * * * *", async () => {
  console.log("⏰ Collecting hourly traffic...");
  await collectHourlyTraffic();
}, {
  timezone:"Asia/Tehran",
});

// hourly clean expired VPNs cron job
// This will run every hour at the 10th minute
cron.schedule("10 * * * *", async () => {
  console.log("🧹 Cleaning expired VPNs...");
  await cleanExpiredVPNs();
}, {
  timezone:"Asia/Tehran",
});

// hourly clean traffic limit cron job
// This will run every hour at the 20th minute
cron.schedule("20 * * * *", async () => {
  console.log("🧹 Cleaning traffic limits...");
  await cleanTrafficLimit();
}, {
  timezone:"Asia/Tehran",
});

// daily backup at 3:00 AM Tehran time
// cron.schedule("0 3 * * *", async () => {
//   console.log("🗄️ Running daily database backup...");
//   await backupDatabase();
// }, {
//   timezone: "Asia/Tehran",
// });