// server/services/leaderboardService.js
// Utility helpers for keeping leaderboard entries in sync with user activity

const LeaderboardEntry = require('../models/Leaderboards');
const DailyTracking = require('../models/DailyTracking');
const { Post } = require('../models/Community');
const UserModel = require('../models/user.model');

let UserProfileModel;
try {
  // userprofile.model exports as default from compiled TypeScript
  UserProfileModel = require('../models/userprofile.model').default;
} catch (error) {
  UserProfileModel = null;
}

class LeaderboardService {
  /**
   * Update or create a leaderboard entry for a user using dashboard metrics
   * @param {string} userId
   * @param {{ ecoScore: number }} metrics
   */
  static async upsertFromDashboard(userId, metrics = {}) {
    if (!userId) {
      return;
    }

    try {
      const [activityCount, postCount, profile, user] = await Promise.all([
        DailyTracking.countDocuments({ userId }),
        Post ? Post.countDocuments({ 'author.userId': userId }) : 0,
        UserProfileModel ? UserProfileModel.findOne({ user: userId }).lean() : null,
        UserModel.findById(userId).lean(),
      ]);

      if (!user) {
        return;
      }

      const ecoScore = Math.max(0, Math.round(metrics.ecoScore ?? 0));

      const username = profile?.username || user.email?.split('@')[0] || 'ecosteps-user';
      const fullName = profile
        ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() || profile.username || username
        : user.email || username;
      const avatarUrl = profile?.profilePic ?? null;
      const badges = Array.isArray(user.achievements)
        ? user.achievements
            .map((achievement) => achievement?.achievementId)
            .filter(Boolean)
            .slice(0, 5)
        : [];

      await LeaderboardEntry.findByIdAndUpdate(
        userId,
        {
          _id: userId,
          username,
          fullName,
          avatarUrl,
          score: ecoScore,
          badges,
          activity: activityCount,
          posts: postCount,
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error) {
      console.error('Failed to upsert leaderboard entry:', error);
    }
  }
}

module.exports = LeaderboardService;