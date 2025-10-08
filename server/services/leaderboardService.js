const Leaderboard = require("../models/leaderboardsModel");
const DailyTracking = require("../models/DailyTracking");
const Post = require("../models/communityModel");

const TIER_CONFIG = {
  Bronze:   { max: 1000, next: "Silver" },
  Silver:   { max: 1000, next: "Gold" },
  Gold:     { max: 1500, next: "Platinum" },
  Platinum: { max: 1500, next: "Diamond" },
  Diamond:  { max: Infinity, next: null },
};

class LeaderboardService {

  static handleTierProgression(entry) {
    const tierInfo = TIER_CONFIG[entry.tier];
    if (!tierInfo) return entry;

    // Promote if current points reach or exceed the tier max
    if (entry.points >= tierInfo.max && tierInfo.next) {
      entry.tier = tierInfo.next;
      entry.points = 0; // Reset points after promotion
      console.log(`🏆 User promoted to ${entry.tier}!`);
    }

    return entry;
  }

  /**
   * Update or create user leaderboard entry by adding EcoScore to points.
   * Only adds once per day.
   */
  static async updateUserPointsFromEcoScore(userId, ecoScore) {
    try {
      if (!userId || ecoScore === undefined) {
        throw new Error("Invalid parameters for leaderboard update");
      }

      const pointsToAdd = Math.round(ecoScore);
      const today = new Date();
      const todayStr = today.toDateString();

      let leaderboardEntry = await Leaderboard.findOne({ user: userId });

      if (leaderboardEntry) {
        const lastUpdateStr = leaderboardEntry.lastUpdated
          ? leaderboardEntry.lastUpdated.toDateString()
          : null;

        if (lastUpdateStr !== todayStr) {
          leaderboardEntry.points += pointsToAdd;
          leaderboardEntry.totalScore += pointsToAdd;
          leaderboardEntry.ecoScore = ecoScore;

          // Handle tier progression and reset if promoted
          leaderboardEntry = this.handleTierProgression(leaderboardEntry);

          leaderboardEntry.lastUpdated = today;
          await leaderboardEntry.save();

          console.log(
            `[Leaderboard] +${pointsToAdd} points for ${userId}, now ${leaderboardEntry.tier}`
          );
        } else {
          console.log(`[Leaderboard] Skipped update for ${userId} (already updated today)`);
        }
      } else {
        // New entry starts at Bronze
        leaderboardEntry = await Leaderboard.create({
          user: userId,
          points: Math.min(pointsToAdd, TIER_CONFIG.Bronze.max),
          totalScore: pointsToAdd,
          ecoScore,
          tier: "Bronze",
          lastUpdated: today,
        });

        console.log(`[Leaderboard] Created new entry for user ${userId}`);
      }

      await this.updateRanks();
      return leaderboardEntry;
    } catch (error) {
      console.error("Leaderboard update error:", error);
      throw error;
    }
  }

  /**
 * Manually add points to a user's leaderboard entry.
 * Useful for custom events like form submissions or achievements.
 * @param {string} userId
 * @param {number} pointsToAdd
 * @param {string} reason (optional) e.g. "Form submission bonus"
 */
  static async addPoints(userId, pointsToAdd, reason = "Manual points update") {
    try {
      if (!userId || !pointsToAdd || pointsToAdd <= 0) {
        throw new Error("Invalid parameters for addPoints");
      }
    
      let leaderboardEntry = await Leaderboard.findOne({ user: userId });
    
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
      if (leaderboardEntry) {
        if (reason === 'Posted in Community Page') {
          const lastDate = leaderboardEntry.lastDailyCommunityPointsDate;
          if (lastDate && lastDate >= todayStart) {
            console.log(`[Leaderboard] Daily Community points already awarded today for user ${userId}`);
            return leaderboardEntry;  // Already awarded today, skip
          }
        }
      
        leaderboardEntry.points += pointsToAdd;
        leaderboardEntry.totalScore += pointsToAdd;
      
        // Update the daily community date if applicable
        if (reason === 'Posted in Community Page') {
          leaderboardEntry.lastDailyCommunityPointsDate = today;
        }
      
        // Handle tier progression (promotion + reset if needed)
        leaderboardEntry = this.handleTierProgression(leaderboardEntry);
      
        leaderboardEntry.lastUpdated = today;
        await leaderboardEntry.save();
      
        console.log(
          `[Leaderboard] +${pointsToAdd} points for ${userId} (${reason}), now ${leaderboardEntry.tier}`
        );
      } else {
        // First-time entry
        const newEntryData = {
          user: userId,
          points: Math.min(pointsToAdd, 1000),
          totalScore: pointsToAdd,
          tier: "Bronze",
          ecoScore: 0,
          lastUpdated: today,
        };
        if (reason === 'Posted in Community Page') {
          newEntryData.lastDailyCommunityPointsDate = today;
        }
        leaderboardEntry = await Leaderboard.create(newEntryData);
      
        console.log(`[Leaderboard] Created new entry for user ${userId} (${reason})`);
      }
    
      await this.updateRanks();
      return leaderboardEntry;
    } catch (error) {
      console.error("Error adding points to leaderboard:", error);
      throw error;
    }
  }



  /**
   * Recalculate and assign ranks for all leaderboard entries.
   */
  static async updateRanks() {
    try {
      const allEntries = await Leaderboard.find().sort({ totalScore: -1 });
      for (let i = 0; i < allEntries.length; i++) {
        allEntries[i].rank = i + 1;
        await allEntries[i].save();
      }
    } catch (error) {
      console.error("Error updating ranks:", error);
    }
  }

  /**
   * Fetch top leaderboard entries.
   */
static async getLeaderboard(limit = 20) {
  try {
    const leaderboard = await Leaderboard.find()
      .populate({
        path: 'user',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .sort({ totalScore: -1 })
      .limit(limit);

    // Loop through leaderboard entries to add counts
    const leaderboardWithCounts = await Promise.all(leaderboard.map(async (entry) => {
      const userId = entry.user.userId;  // Assuming `userId` is the identifier for the user

      // Count the posts for this user
      const Posts = await Post.countDocuments({ author: userId });

      // Count the daily trackings for this user
      const Activity = await DailyTracking.countDocuments({ userId });

      return {
        id: entry._id,
        user: entry.user,
        rank: entry.rank,
        points: entry.points,
        totalScore: entry.totalScore,
        ecoScore: entry.ecoScore,
        tier: entry.tier,
        lastUpdated: entry.lastUpdated,
        Activity,
        Posts,
      };
    }));

    return leaderboardWithCounts;
    
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    throw error;
  }
}


  /**
   * Fetch a specific user’s leaderboard details.
   */
  static async getUserLeaderboardInfo(userId) {
    try {
      const userEntry = await Leaderboard.findOne({ user: userId })
      .populate({
        path: 'user',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })

            // Count the posts for this user
      const Posts = await Post.countDocuments({ author: userId });

      // Count the daily trackings for this user
      const Activity = await DailyTracking.countDocuments({ userId });

      if (!userEntry) {
        return { message: "User not found in leaderboard" };
      }

      return {
        user: userEntry.user,
        rank: userEntry.rank,
        points: userEntry.points,
        totalScore: userEntry.totalScore,
        ecoScore: userEntry.ecoScore,
        tier: userEntry.tier,
        Posts,
        Activity
      };
    } catch (error) {
      console.error("Error fetching user leaderboard info:", error);
      throw error;
    }
  }
}

module.exports = LeaderboardService;
