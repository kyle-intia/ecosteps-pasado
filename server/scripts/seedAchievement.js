// server/scripts/seedAchievements.js - Put in server/scripts/
const mongoose = require('mongoose');
const path = require('path');
const AchievementService = require('../services/achievementService');
const User = require('../models/user.model');
const DailyTracking = require('../models/DailyTracking');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function seedAchievements() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: 'auth_db' });
    console.log('Connected to MongoDB');

    await AchievementService.seedAchievements();
    console.log('Achievement seeding completed');

    // Update stats for existing users based on their tracking history
    console.log('Updating achievement stats for existing users...');
    const users = await User.find({});
    let statsUpdated = 0;

    for (const user of users) {
      try {
        const trackingCount = await DailyTracking.countDocuments({ userId: user._id });
        if (trackingCount > 0 && user.achievementStats.totalTrackingDays === 0) {
          await AchievementService.updateUserStats(user._id, {
            totalTrackingDays: trackingCount
          });
          statsUpdated++;
          console.log(`Updated stats for user ${user.email}: totalTrackingDays = ${trackingCount}`);
        }
      } catch (error) {
        console.error(`Error updating stats for user ${user.email}:`, error);
      }
    }

    console.log(`Stats updated for ${statsUpdated} users`);

    // Check achievements for all existing users
    console.log('Checking achievements for existing users...');
    let totalNewAchievements = 0;

    for (const user of users) {
      try {
        // Provide dummy context values to prevent ReferenceError in eval
        const dummyContext = {
          dailyFootprint: 0, // Default value for carbon-based conditions
          dailyChallengesCompleted: 0, // Default for challenge completion
          isCarFree: false, // Default transport condition
          isPlantBased: false // Default food condition
        };

        // Check for daily tracking achievements
        const dailyAchievements = await AchievementService.checkAchievements(
          user._id,
          'DAILY_TRACKING_COMPLETE',
          dummyContext
        );

        // Check for challenge achievements
        const challengeAchievements = await AchievementService.checkAchievements(
          user._id,
          'CHALLENGE_COMPLETE',
          dummyContext
        );

        const newCount = dailyAchievements.length + challengeAchievements.length;
        if (newCount > 0) {
          console.log(`User ${user.email}: ${newCount} new achievements unlocked`);
          totalNewAchievements += newCount;
        }
      } catch (error) {
        console.error(`Error checking achievements for user ${user.email}:`, error);
      }
    }

    console.log(`Retroactive achievement check completed. Total new achievements unlocked: ${totalNewAchievements}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding achievements:', error);
    process.exit(1);
  }
}

seedAchievements();
