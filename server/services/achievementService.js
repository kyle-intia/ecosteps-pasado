// server/services/achievementService.js - Achievement business logic
const User = require('../models/user.model');
const Achievement = require('../models/Achievement');
const Notification = require('../models/Notification');

// All 28 achievements from the XML specification
const ACHIEVEMENT_DEFINITIONS = [
  // Daily & Consistency Achievements
  {
    id: "first_step",
    name: "First Step",
    description: "Complete your first daily tracking entry",
    category: "daily",
    tier: "bronze",
    icon: "📝",
    targetValue: 1,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.totalTrackingDays >= 1",
    profilePriority: 5,
    notificationPriority: "high"
  },
  {
    id: "week_warrior",
    name: "Week Warrior", 
    description: "Complete daily tracking for 7 consecutive days",
    category: "daily",
    tier: "silver",
    icon: "⚔️",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.currentStreak >= 7",
    profilePriority: 8,
    notificationPriority: "high"
  },
  {
    id: "month_master",
    name: "Month Master",
    description: "Track for 30 days total",
    category: "daily", 
    tier: "gold",
    icon: "📅",
    targetValue: 30,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.totalTrackingDays >= 30",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "year_yolo",
    name: "Year Yolo",
    description: "Complete daily tracking for one year",
    category: "daily",
    tier: "platinum", 
    icon: "🎉",
    targetValue: 365,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.totalTrackingDays >= 365",
    profilePriority: 10,
    notificationPriority: "high"
  },
  {
    id: "perfect_week",
    name: "Perfect Week",
    description: "Complete all 3 daily challenges every day for a week",
    category: "daily",
    tier: "gold",
    icon: "⭐",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE", 
    unlockCondition: "stats.perfectChallengeWeeks >= 1",
    profilePriority: 9,
    notificationPriority: "high"
  },
  
  // Challenge-Based Achievements
  {
    id: "challenge_newbie",
    name: "Challenge Newbie",
    description: "Complete your first eco-challenge",
    category: "challenge",
    tier: "bronze",
    icon: "🎯",
    targetValue: 1,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.totalChallengesCompleted >= 1", 
    profilePriority: 6,
    notificationPriority: "high"
  },
  {
    id: "transport_titan",
    name: "Transport Titan",
    description: "Complete 10 transport challenges",
    category: "challenge",
    tier: "silver",
    icon: "🚆",
    targetValue: 10,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.transportChallengesCompleted >= 10",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "home_hero",
    name: "Home Hero",
    description: "Complete 10 home energy challenges", 
    category: "challenge",
    tier: "silver",
    icon: "🏠",
    targetValue: 10,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.homeChallengesCompleted >= 10",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "food_fighter",
    name: "Food Fighter",
    description: "Complete 10 food challenges",
    category: "challenge",
    tier: "silver", 
    icon: "🍎",
    targetValue: 10,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.foodChallengesCompleted >= 10",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "triple_threat",
    name: "Triple Threat",
    description: "Complete all 3 challenges in one day",
    category: "challenge",
    tier: "gold",
    icon: "🔥", 
    targetValue: 1,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "dailyChallengesCompleted === 3",
    profilePriority: 10,
    notificationPriority: "high"
  },
  {
    id: "consistent_saver",
    name: "Consistent Saver",
    description: "Save 50 kg CO₂e through challenges",
    category: "challenge",
    tier: "silver",
    icon: "💪",
    targetValue: 50,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.totalCO2Saved >= 50",
    profilePriority: 6,
    notificationPriority: "medium"
  },

  // Carbon Reduction Achievements
  {
    id: "carbon_conscious",
    name: "Carbon Conscious", 
    description: "Reduce your daily footprint below 10 kg",
    category: "carbon",
    tier: "silver",
    icon: "🌱",
    targetValue: 10,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "dailyFootprint <= 10",
    profilePriority: 9,
    notificationPriority: "medium"
  },
  {
    id: "eco_novice",
    name: "Eco Novice",
    description: "Save 100 kg CO₂e total",
    category: "carbon",
    tier: "bronze",
    icon: "🌍",
    targetValue: 100,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.totalCO2Saved >= 100",
    profilePriority: 6,
    notificationPriority: "medium"
  },
  {
    id: "climate_champion",
    name: "Climate Champion",
    description: "Save 500 kg CO₂e total",
    category: "carbon",
    tier: "gold", 
    icon: "🏆",
    targetValue: 500,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.totalCO2Saved >= 500",
    profilePriority: 9,
    notificationPriority: "high"
  },
  {
    id: "planet_protector",
    name: "Planet Protector",
    description: "Save 1,000 kg CO₂e total",
    category: "carbon",
    tier: "platinum",
    icon: "🥇",
    targetValue: 1000,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.totalCO2Saved >= 1000",
    profilePriority: 10,
    notificationPriority: "high"
  },
  {
    id: "zero_hero",
    name: "Zero Hero",
    description: "Achieve a daily footprint under 5 kg", 
    category: "carbon",
    tier: "platinum",
    icon: "🚀",
    targetValue: 5,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "dailyFootprint <= 5",
    profilePriority: 10,
    notificationPriority: "high"
  },

  // Transport Achievements
  {
    id: "car_free_crusader",
    name: "Car-Free Crusader",
    description: "Use no personal car for 7 days",
    category: "transport",
    tier: "silver",
    icon: "🚫",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.carFreeDays >= 7",
    profilePriority: 8,
    notificationPriority: "medium"
  },
  {
    id: "public_transport_pro",
    name: "Public Transport Pro",
    description: "Take public transport 10 times",
    category: "transport",
    tier: "bronze",
    icon: "🚌",
    targetValue: 10,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.publicTransportUses >= 10",
    profilePriority: 5,
    notificationPriority: "medium"
  },
  {
    id: "walking_wonder",
    name: "Walking Wonder", 
    description: "Log 50 km walking total",
    category: "transport",
    tier: "silver",
    icon: "🚶",
    targetValue: 50,
    triggerEvent: "DAILY_TRACKING_COMPLETE", 
    unlockCondition: "stats.totalWalkingDistance >= 50",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "flight_free",
    name: "Flight-Free",
    description: "Go 30 days without flight emissions",
    category: "transport",
    tier: "gold",
    icon: "✈️",
    targetValue: 30,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.flightFreeDays >= 30",
    profilePriority: 9,
    notificationPriority: "high"
  },

  // Home Energy Achievements
  {
    id: "energy_saver",
    name: "Energy Saver", 
    description: "Use no high-energy appliances for 5 days",
    category: "home",
    tier: "bronze",
    icon: "💡",
    targetValue: 5,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.energySaverDays >= 5",
    profilePriority: 6,
    notificationPriority: "medium"
  },
  {
    id: "thermostat_master",
    name: "Thermostat Master",
    description: "Maintain efficient temperature settings for a week",
    category: "home",
    tier: "silver",
    icon: "🌡️",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.efficientTempDays >= 7",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "unplugged_expert",
    name: "Unplugged Expert",
    description: "Complete \"Unplugged Day\" challenge 5 times",
    category: "home",
    tier: "silver", 
    icon: "🔌",
    targetValue: 5,
    triggerEvent: "CHALLENGE_COMPLETE",
    unlockCondition: "stats.unpluggedCompletions >= 5",
    profilePriority: 7,
    notificationPriority: "medium"
  },

  // Food Achievements
  {
    id: "plants_vs_zombies",
    name: "Plants Vs Zombies",
    description: "Choose plant-based meals for 7 consecutive days",
    category: "food",
    tier: "silver",
    icon: "🌱",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.plantBasedStreak >= 7",
    profilePriority: 8,
    notificationPriority: "medium"
  },
  {
    id: "skipping_series",
    name: "Skipping Series", 
    description: "Choose skipped meals for 7 consecutive days",
    category: "food",
    tier: "bronze",
    icon: "⏭️",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.mealSkipStreak >= 7",
    profilePriority: 6,
    notificationPriority: "medium"
  },
  {
    id: "mister_mixer",
    name: "Mister Mixer",
    description: "Choose mixed combination meals for 7 consecutive days",
    category: "food",
    tier: "bronze",
    icon: "🍽️",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.mixedMealStreak >= 7",
    profilePriority: 6,
    notificationPriority: "medium"
  },
  {
    id: "leftover_legend",
    name: "Leftover Legend",
    description: "Report eating leftovers 5 times", 
    category: "food",
    tier: "silver",
    icon: "🍲",
    targetValue: 5,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.leftoverMeals >= 5",
    profilePriority: 7,
    notificationPriority: "medium"
  },
  {
    id: "dairy_diary",
    name: "Dairy Diary",
    description: "Choose dairy-based meals for 7 consecutive days",
    category: "food",
    tier: "bronze",
    icon: "🥛",
    targetValue: 7,
    triggerEvent: "DAILY_TRACKING_COMPLETE",
    unlockCondition: "stats.dairyBasedStreak >= 7",
    profilePriority: 5,
    notificationPriority: "medium"
  }
];

class AchievementService {
  static async seedAchievements() {
    try {
      // Drop the collection to avoid index issues
      await Achievement.collection.drop().catch(() => console.log('Collection did not exist or could not be dropped'));
      console.log('Dropped achievements collection');

      for (const achievementData of ACHIEVEMENT_DEFINITIONS) {
        await Achievement.create({
          achievementId: achievementData.id,
          name: achievementData.name,
          description: achievementData.description,
          category: achievementData.category,
          tier: achievementData.tier,
          icon: achievementData.icon,
          targetValue: achievementData.targetValue,
          triggerEvent: achievementData.triggerEvent,
          unlockCondition: achievementData.unlockCondition,
          profilePriority: achievementData.profilePriority,
          notificationPriority: achievementData.notificationPriority
        });
      }
      console.log('Achievement definitions seeded successfully');
    } catch (error) {
      console.error('Error seeding achievements:', error);
    }
  }

  static async checkAchievements(userId, triggerEvent, context = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) return [];

      const achievements = await Achievement.find({ 
        triggerEvent, 
        isActive: true 
      });
      
      const newlyUnlocked = [];

      for (const achievement of achievements) {
        if (!user.hasAchievement(achievement.achievementId)) {
          const unlocked = this.evaluateUnlockCondition(
            achievement.unlockCondition,
            user.achievementStats,
            context
          );

          if (unlocked) {
            // Add achievement to user
            user.achievements.push({
              achievementId: achievement.achievementId,
              unlockedAt: new Date(),
              progress: achievement.targetValue,
              category: achievement.category
            });

            // Create notification
            await this.createNotification(userId, {
              type: 'achievement_unlock',
              title: `Achievement Unlocked!`,
              message: `You earned "${achievement.name}"`,
              achievementId: achievement.achievementId,
              data: {
                icon: achievement.icon,
                category: achievement.category,
                tier: achievement.tier
              }
            });

            newlyUnlocked.push(achievement);
          }
        }
      }

      if (newlyUnlocked.length > 0) {
        await user.save();
      }

      return newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  static evaluateUnlockCondition(condition, stats, context) {
    try {
      // Replace stats references with actual values
      let evalCondition = condition;
      
      // Replace stats.* with actual stat values
      Object.keys(stats).forEach(key => {
        const regex = new RegExp(`stats\\.${key}`, 'g');
        evalCondition = evalCondition.replace(regex, stats[key] || 0);
      });

      // Replace context values
      Object.keys(context).forEach(key => {
        const regex = new RegExp(key, 'g');
        evalCondition = evalCondition.replace(regex, context[key]);
      });

      // Use eval carefully (in production, consider a safer expression evaluator)
      return eval(evalCondition);
    } catch (error) {
      console.error('Error evaluating unlock condition:', error);
      return false;
    }
  }

  static async createNotification(userId, notificationData) {
    try {
      const notification = new Notification({
        userId,
        ...notificationData
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  static async getUserAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const allAchievements = await Achievement.find({ isActive: true });
      
      const achievementsWithStatus = allAchievements.map(achievement => {
        const userAchievement = user.achievements.find(
          a => a.achievementId === achievement.achievementId
        );
        
        return {
          ...achievement.toObject(),
          unlocked: !!userAchievement,
          unlockedAt: userAchievement?.unlockedAt,
          progress: userAchievement?.progress || 0,
          isEquipped: user.equippedAchievements.some(
            e => e.achievementId === achievement.achievementId
          )
        };
      });

      return {
        achievements: achievementsWithStatus,
        equipped: user.equippedAchievements,
        stats: user.achievementStats
      };
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }

  static async equipAchievement(userId, achievementId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      user.equipAchievement(achievementId);
      await user.save();
      
      return user.equippedAchievements;
    } catch (error) {
      console.error('Error equipping achievement:', error);
      throw error;
    }
  }

  static async unequipAchievement(userId, achievementId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      user.equippedAchievements = user.equippedAchievements.filter(
        e => e.achievementId !== achievementId
      );
      
      await user.save();
      return user.equippedAchievements;
    } catch (error) {
      console.error('Error unequipping achievement:', error);
      throw error;
    }
  }

  static async updateUserStats(userId, statUpdates) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      Object.keys(statUpdates).forEach(key => {
        if (user.achievementStats[key] !== undefined) {
          user.achievementStats[key] = statUpdates[key];
        }
      });

      await user.save();
      return user.achievementStats;
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }
}

module.exports = AchievementService;