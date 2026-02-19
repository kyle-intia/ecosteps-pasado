const mongoose = require("mongoose");
const path = require("path");
const AchievementService = require("../services/achievementService");
const User = require("../models/user.model");
const DailyTracking = require("../models/DailyTracking");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

async function seedAchievements() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "ecosteps_db" });

    await AchievementService.seedAchievements();
    console.log("Achievement seeding completed");

    console.log("Updating achievement stats for existing users...");
    const users = await User.find({});

    const updateUserStats = async (user) => {
      const trackingCount = await DailyTracking.countDocuments({
        userId: user._id,
      });
      if (trackingCount > 0 && user.achievementStats.totalTrackingDays === 0) {
        await AchievementService.updateUserStats(user._id, {
          totalTrackingDays: trackingCount,
        });
        return { email: user.email, trackingCount };
      }
      return null;
    };

    const results = await Promise.all(users.map(updateUserStats));

    const statsUpdated = results.filter((result) => result !== null).length;
    results.forEach((result) => {
      if (result) {
        console.log(
          `Updated stats for user ${result.email}: totalTrackingDays = ${result.trackingCount}`,
        );
      }
    });

    console.log(`Stats updated for ${statsUpdated} users`);

    console.log("Checking achievements for existing users...");
    let totalNewAchievements = 0;

    const checkUserAchievements = async (user) => {
      try {
        const dummyContext = {
          dailyFootprint: 0,
          dailyChallengesCompleted: 0,
          isCarFree: false,
          isPlantBased: false,
        };

        const dailyAchievements = await AchievementService.checkAchievements(
          user._id,
          "DAILY_TRACKING_COMPLETE",
          dummyContext,
        );

        const challengeAchievements =
          await AchievementService.checkAchievements(
            user._id,
            "CHALLENGE_COMPLETE",
            dummyContext,
          );

        const newCount =
          dailyAchievements.length + challengeAchievements.length;
        if (newCount > 0) {
          console.log(
            `User ${user.email}: ${newCount} new achievements unlocked`,
          );
          totalNewAchievements += newCount;
        }
      } catch (error) {
        console.error(
          `Error checking achievements for user ${user.email}:`,
          error,
        );
      }
    };

    await Promise.all(users.map(checkUserAchievements));

    console.log(
      `Retroactive achievement check completed. Total new achievements unlocked: ${totalNewAchievements}`,
    );
  } catch (error) {
    console.error("Error seeding achievements:", error);
    process.exit(1);
  }
}

module.exports = seedAchievements;
