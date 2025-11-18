const cron = require("node-cron");
const CertificateRewardService = require("../services/certificateRewardService");
const User = require("../models/User"); // assuming a user model

// run every day at 01:00
cron.schedule("0 1 * * *", async () => {
  try {
    console.log("[cron] Running daily achievement check");
    // Get all users (optionally only active users)
    const users = await User.find({}, { _id: 1 });
    for (const u of users) {
      try {
        const result = await CertificateRewardService.runAllChecksForUser(u._id);
        if ((result.certificates && result.certificates.length) || (result.rewards && result.rewards.length)) {
          console.log(`[cron] User ${u._id} unlocked:`, {
            certificates: result.certificates.length,
            rewards: result.rewards.length
          });
          // TODO: notify users (email, push, websocket)
        }
      } catch (err) {
        console.error(`[cron] Failed check for user ${u._id}:`, err);
      }
    }
  } catch (err) {
    console.error("[cron] Daily achievement job failed:", err);
  }
});
