// server/services/leaderboardService.js
// Utility helpers for keeping leaderboard entries in sync with user activity

const LeaderboardEntry = require('../models/Leaderboards');
const DailyTracking = require('../models/DailyTracking');
const Achievement = require('../models/Achievement');
const { Post } = require('../models/Community');
const UserModel = require('../models/user.model');

let UserProfileModel;
try {
  UserProfileModel = require('../models/userprofile.model').default;
} catch (error) {
  console.log('UserProfile model not available, profile features will be limited');
  UserProfileModel = null;
}

class LeaderboardService {
  /**
   * Update or create a leaderboard entry for a user using dashboard metrics
   * @param {string} userId
   * @param {{ ecoScore: number }} metrics
   */
  static async upsertFromDashboard(userId, metrics = {}) {
    try {
      if (!userId) {
        return;
      }

      // fetch user doc
      const user = await UserModel.findById(userId).lean();
      if (!user) {
        return;
      }

      let badgeNames = [];
      // get achievement id
      const unlockedAchievementStringIds = (user.achievements || [])
        .map(unlocked => unlocked.achievementId) // This is the correct field
        .filter(Boolean);

      //
      if (unlockedAchievementStringIds.length > 0) {
      
        const achievements = await Achievement.find({
          achievementId: { $in: unlockedAchievementStringIds }
        }).select('title name displayName').lean();

        // extract names from achievement doc
        badgeNames = achievements.map(
          ach => ach.title || ach.name || ach.displayName
        ).filter(Boolean);
      }

      // fetch other stats and update the leaderboard entry
      const [activityCount, postCount, profile] = await Promise.all([
        DailyTracking.countDocuments({ userId }),
        Post ? Post.countDocuments({ 'author.userId': userId }) : 0,
        UserProfileModel ? UserProfileModel.findOne({ user: userId }).lean() : null,
      ]);

      const avatarUrl = profile?.profilePic ?? null;
      const fullName = profile ? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim() : user.fullName || user.name;

      await LeaderboardEntry.findByIdAndUpdate(
        userId,
        {
          _id: userId,
          username: user.username,
          fullName: fullName || user.username,
          avatarUrl,
          score: Math.round(metrics.ecoScore || 0),
          badges: badgeNames.slice(0, 5),
          activity: activityCount || 0,
          posts: postCount || 0,
        },
        { upsert: true, new: true }
      );

    } catch (error) {
      console.error('Error in leaderboard service:', error);
    }
  }
}

module.exports = LeaderboardService;