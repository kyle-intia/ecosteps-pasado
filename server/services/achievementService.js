// server/services/achievementService.js - Achievement business logic
const User = require('../models/user.model');
const Achievement = require('../models/Achievement');
const badgeAchievementModel = require("../models/badgeAchivementModel")
const NotificationAchievements = require('../models/Notification');
const badgeAchievementService = require('../services/badgeAchievementService'); 
const NotificationService = require('../services/notificationService');


const getUTCDateOnly = (date = new Date()) => {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};


class AchievementService {
  static async seedAchievements() {
    try {
      // Drop the collection to avoid index issues
      //await Achievement.collection.drop().catch(() => console.log('Collection did not exist or could not be dropped'));
      //console.log('Dropped achievements collection');
      const achievements = await badgeAchievementService.getAllAchievements();

      for (const achievementData of achievements) { 

      // Ensure achievementId exists
      if (!achievementData.id) {
        console.error('Missing achievementId for:', achievementData);
        continue; // Skip invalid achievements
      }

        const existingAchievement = await Achievement.findOne({ achievementId: achievementData.id });
        if (!existingAchievement) {
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
        } else {
          
        }
      }
      console.log('Achievement definitions seeded successfully');
    } catch (error) {
      console.error('Error seeding achievements:', error);
    }
  }

  static async checkAchievements(userId, triggerEvent, context = {}) {
    try {
      const todayDateOnly = getUTCDateOnly();

      const user = await User.findById(userId);
      if (!user) return [];

      const achievements = await Achievement.find({ triggerEvent, isActive: true });
      
      const newlyUnlocked = [];

      for (const achievement of achievements) {

      const achievementId = achievement.id;  // Use 'id' from your achievement data
      if (!achievementId) {
        console.error(`Missing achievementId for achievement: ${achievement.name}`);
        continue;
      }

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
            await this.createNotificationAchievement(userId, {
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

            await NotificationService.createNotification(
              userId,
              `${achievement.name} Unlocked!`,
              'achievement',
              {
                link: `/achievements`,
                action: 'achievement',
                data: {
                  action: 'achievement',
                  achievementId: achievement._id,
                  achievementName: achievement.name,
                  rarity: achievement.rarity || 'common', // rare, epic, legendary
                  points: achievement.points || 100
                }
              }
            );

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

  static async createNotificationAchievement(userId, notificationData) {
    try {
      const notification = new NotificationAchievements({
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

  static async updateUserStats(userId, statUpdates, increment = false) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      Object.keys(statUpdates).forEach(key => {
        if (user.achievementStats[key] !== undefined) {
          if (increment) {
            user.achievementStats[key] += statUpdates[key];
          } else {
            user.achievementStats[key] = statUpdates[key];
          }
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