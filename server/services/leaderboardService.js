const Leaderboard = require("../models/leaderboardsModel");
const DailyTracking = require("../models/DailyTracking");
const Post = require("../models/communityModel");

const TIER_CONFIG = {
  Bronze: { max: 3500, next: "Silver" },
  Silver: { max: 4000, next: "Gold" },
  Gold: { max: 5500, next: "Platinum" },
  Platinum: { max: 6500, next: "Diamond" },
  Diamond: { max: Infinity, next: null },
};

class LeaderboardService {
  static handleTierProgression(entry) {
    const tierInfo = TIER_CONFIG[entry.tier];
    if (!tierInfo) return entry;

    if (entry.points >= tierInfo.max && tierInfo.next) {
      entry.tier = tierInfo.next;
      entry.points = 0;
    }

    return entry;
  }

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

          leaderboardEntry = this.handleTierProgression(leaderboardEntry);

          leaderboardEntry.lastUpdated = today;

          await leaderboardEntry.save();
        } else {
          console.log(
            `User ${userId} already has points updated today, skipping ecoScore update`,
          );
        }
      } else {
        leaderboardEntry = await Leaderboard.create({
          user: userId,
          points: Math.min(pointsToAdd, TIER_CONFIG.Bronze.max),
          totalScore: pointsToAdd,
          ecoScore,
          tier: "Bronze",
          lastUpdated: today,
        });
      }

      await this.updateRanks();
      return leaderboardEntry;
    } catch (error) {
      console.error("Leaderboard update error:", error);
      throw error;
    }
  }

  static async addPoints(userId, pointsToAdd, reason = "Manual points update") {
    try {
      if (!userId || !pointsToAdd || pointsToAdd <= 0) {
        throw new Error("Invalid parameters for addPoints");
      }

      let leaderboardEntry = await Leaderboard.findOne({ user: userId });

      const today = new Date();
      const todayStart = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
      );

      if (leaderboardEntry) {
        if (reason === "Posted in Community Page") {
          const lastDate = leaderboardEntry.lastDailyCommunityPointsDate;
          if (lastDate && lastDate >= todayStart) {
            return leaderboardEntry;
          }
        }

        if (reason === "Completed a daily tracking") {
          const lastDate = leaderboardEntry.lastUpdated;
          if (lastDate && lastDate >= todayStart) {
            return leaderboardEntry;
          }
        }

        leaderboardEntry.points += pointsToAdd;
        leaderboardEntry.totalScore += pointsToAdd;

        if (reason === "Posted in Community Page") {
          leaderboardEntry.lastDailyCommunityPointsDate = today;
        }

        if (reason === "Completed a daily tracking") {
          leaderboardEntry.lastUpdated = today;
        }

        leaderboardEntry = this.handleTierProgression(leaderboardEntry);

        leaderboardEntry.lastUpdated = today;
        await leaderboardEntry.save();

        console.log(
          `[Leaderboard] +${pointsToAdd} points for ${userId} (${reason}), now ${leaderboardEntry.tier}`,
        );
      } else {
        const newEntryData = {
          user: userId,
          points: Math.min(pointsToAdd, 1000),
          totalScore: pointsToAdd,
          tier: "Bronze",
          ecoScore: 0,
          lastUpdated: today,
        };
        if (reason === "Posted in Community Page") {
          newEntryData.lastDailyCommunityPointsDate = today;
        }
        leaderboardEntry = await Leaderboard.create(newEntryData);
      }

      await this.updateRanks();
      return leaderboardEntry;
    } catch (error) {
      console.error("Error adding points to leaderboard:", error);
      throw error;
    }
  }

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

  static async getLeaderboard(limit = 20) {
    try {
      const leaderboard = await Leaderboard.find()
        .populate({
          path: "user",
          model: "users_profile",
          localField: "author",
          foreignField: "userId",
          justOne: true,
          select: "firstName lastName username profilePic",
        })
        .sort({ totalScore: -1 })
        .limit(limit);

      const leaderboardWithCounts = await Promise.all(
        leaderboard.map(async (entry) => {
          const userId = entry.user.userId;

          const Posts = await Post.countDocuments({ author: userId });

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
        }),
      );

      return leaderboardWithCounts;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  static async getUserLeaderboardInfo(userId) {
    try {
      const userEntry = await Leaderboard.findOne({ user: userId }).populate({
        path: "user",
        model: "users_profile",
        localField: "author",
        foreignField: "userId",
        justOne: true,
        select: "firstName lastName username profilePic",
      });

      const Posts = await Post.countDocuments({ author: userId });

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
        Activity,
      };
    } catch (error) {
      console.error("Error fetching user leaderboard info:", error);
      throw error;
    }
  }
}

module.exports = LeaderboardService;
