const Activity = require("../models/activity.model");
const Certificate = require("../models/certificateModel");
const Reward = require("../models/rewardModel");
const UserCertificate = require("../models/userCertificateModel");
const UserReward = require("../models/userRewardModel");
const { getUserStats, getMonthlyStats } = require("./stats.service");
const LeaderboardService = require("../services/leaderboardService");

class CertificateRewardService {

  // Compute user stats including totals, points, and daily/monthly stats
  static async computeUserStats(userId) {
    const activities = await Activity.find({ userId });

    const transportTypes = {
      private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
      public: ["tricycle", "jeep", "e-jeep", "train"],
      basic: ["walk", "bicycle"],
    };

    const totals = { dates: [], points: 0, totalDistance: 0, categories: {}, subtypes: {} };

    for (const category in transportTypes) {
      totals.categories[category] = 0;
      for (const subtype of transportTypes[category]) totals.subtypes[subtype] = 0;
    }

    const findCategory = subtype => {
      for (const category in transportTypes) if (transportTypes[category].includes(subtype)) return category;
      return null;
    };

    for (const a of activities) {
      const subtype = a.subtype;
      const category = findCategory(subtype);

      if (a.distanceKm && totals.subtypes.hasOwnProperty(subtype)) {
        totals.subtypes[subtype] += a.distanceKm;
        totals.totalDistance += a.distanceKm;
        if (category) totals.categories[category] += a.distanceKm;
      }

      totals.points += Number(a.points || 0);
      if (a.createdAt) totals.dates.push(a.createdAt.toISOString().split("T")[0]);
    }

    totals.dates.sort();

    const dailyStats = await getUserStats(userId, 7);
    const monthlyStats = await getMonthlyStats(userId);
    const userInfo = await LeaderboardService.getUserLeaderboardInfo(userId) || null;

    return { totals, activities, dailyStats, monthlyStats, userInfo };
  }

  static computeStreak(datesSorted) {
    if (!datesSorted || datesSorted.length === 0) return 0;

    const dateSet = new Set(datesSorted);
    let current = new Date();
    const todayStr = current.toISOString().slice(0, 10);
    if (!dateSet.has(todayStr)) current = new Date(datesSorted[datesSorted.length - 1]);

    let streak = 0;
    while (true) {
      const day = current.toISOString().slice(0, 10);
      if (dateSet.has(day)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else break;
    }
    return streak;
  }

  static parseRequirement(objOrString) {
    if (!objOrString) return null;
    if (typeof objOrString === "string") {
      const [type, value] = objOrString.split("_");
      return value ? { type, value: Number(value) } : null;
    }
    if (typeof objOrString === "object" && objOrString.type) {
      return { type: objOrString.type, value: Number(objOrString.value || 0) };
    }
    return null;
  }

  // Certificates
  static async checkCertificatesForUser(userId, stats = null) {
    stats = stats || await this.computeUserStats(userId);
    const { totals, activities, monthlyStats } = stats;
    const mergedStats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const certificates = await Certificate.find();
    const newlyUnlocked = [];

    for (const cert of certificates) {
      const exists = await UserCertificate.findOne({ userId, certificateId: cert._id });
      if (exists) continue;

      const req = this.parseRequirement(cert.requirement || cert.unlockRequirement);
      if (req && this.requirementSatisfied(req, mergedStats)) {
        const doc = new UserCertificate({ userId, certificateId: cert._id, unlockedAt: new Date() });
        await doc.save();
        newlyUnlocked.push({ certificate: cert, earnedAt: doc.unlockedAt });
      }
    }
    return newlyUnlocked;
  }

  // Rewards
  static async checkRewardsForUser(userId, stats = null) {
    stats = stats || await this.computeUserStats(userId);
    const { totals, activities, monthlyStats } = stats;
    const mergedStats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const rewards = await Reward.find();
    const newlyClaimable = [];

    for (const r of rewards) {
      const req = this.parseRequirement(r.requirement || r.claimRequirement);
      const existing = await UserReward.findOne({ userId, rewardId: r._id });
      if (existing?.status === "claimed") continue;

      if (req && this.requirementSatisfied(req, mergedStats)) {
        if (!existing) {
          const u = new UserReward({ userId, rewardId: r._id, claimableAt: new Date(), status: "claimable" });
          await u.save();
          newlyClaimable.push({ reward: r, claimableAt: u.claimableAt });
        } else if (existing.status === "locked") {
          existing.status = "claimable";
          existing.claimableAt = new Date();
          await existing.save();
          newlyClaimable.push({ reward: r, claimableAt: existing.claimableAt });
        }
      }
    }
    return newlyClaimable;
  }

  static async runAllChecksForUser(userId) {
    const stats = await this.computeUserStats(userId);
    const certificates = await this.checkCertificatesForUser(userId, stats);
    const rewards = await this.checkRewardsForUser(userId, stats);
    return { certificates, rewards };
  }

  static async claimReward(userId, rewardId) {
    const ur = await UserReward.findOne({ userId, rewardId });
    if (!ur) return { ok: false, code: "not_found" };
    if (ur.status !== "claimable") return { ok: false, code: "not_claimable" };

    const reward = await Reward.findById(rewardId).lean();
    if (!reward) return { ok: false, code: "not_found" };

    ur.status = "claimed";
    ur.claimedAt = new Date();
    await ur.save();

    return {
      ok: true,
      claimedAt: ur.claimedAt,
      rewardId: reward._id,
      rewardItem: reward.rewardItem,
      title: reward.title,
      rewardType: reward.rewardType,
      body: reward.body
    };
  }


  static computeProgress(requirement, stats) {
      if (!requirement || !requirement.type) return 0;

      const typeKey = requirement.type.toLowerCase();
      const value = requirement.value || 0;

      const checkers = {
          // Subtypes
          walk: s => s.subtypes?.walk || 0,
          bike: s => s.subtypes?.bicycle || 0,
          diesel: s => s.subtypes?.diesel || 0,
          electric: s => s.subtypes?.electric || 0,
          gasoline: s => s.subtypes?.gasoline || 0,
          hybrid: s => s.subtypes?.hybrid || 0,
          motorcycle: s => s.subtypes?.motorcycle || 0,
          tricycle: s => s.subtypes?.tricycle || 0,
          jeep: s => s.subtypes?.jeep || 0,
          eJeep: s => s.subtypes?.["e-jeep"] || 0,
          train: s => s.subtypes?.train || 0,

          // Categories
          private: s => s.categories?.private || 0,
          public: s => s.categories?.public || 0,
          basic: s => s.categories?.basic || 0,

          // Totals
          totaldistance: s => s.totalDistance || 0,
          points: s => s.points || 0,
          activitiescount: s => s.activitiesCount || 0,

          // Streak / Dates
          streak: s => this.computeStreak(s.dates),
          daysactive: s => s.dates?.length || 0,

          // Daily / Monthly stats
          monthlycarbon: s => s.monthlyStats?.averageFootprint || 0,
          dailycarbon: s => s.dailyStats?.averageFootprint || 0,
          monthlyentries: s => s.monthlyStats?.totalEntries || 0,
          dailyentries: s => s.dailyStats?.totalEntries || 0,

          // User info / leaderboard
          totalpoints: s => s.userInfo?.totalScore || 0,
          rank: s => s.userInfo?.rank || 0,
          tier: s => s.userInfo?.tier || null,
          ecoscore: s => s.userInfo?.ecoScore || 0,
          posts: s => s.userInfo?.Posts || 0,
          activity: s => s.userInfo?.Activity || 0,

          // Derived / Optional
          motorizeddistance: s => (s.categories?.private || 0) + (s.categories?.public || 0),
          activedistance: s => (s.categories?.private || 0) + (s.categories?.public || 0) + (s.categories?.basic || 0)
      };

      if (!(typeKey in checkers)) return 0;

      const statValue = checkers[typeKey](stats);

      const lessIsBetter = ["monthlycarbon", "dailycarbon", "carbon"];
      if (lessIsBetter.includes(typeKey)) {
          // For carbon-type stats, lower is better
          return Math.min(value > 0 ? value / statValue : 1, 1);
      }
      return Math.min(statValue / value, 1);
  }

  // Unified requirement check
  static requirementSatisfied(requirement, stats) {
      if (!requirement) return false;
      const progress = this.computeProgress(requirement, stats);
      const typeKey = requirement.type.toLowerCase();
      const lessIsBetter = ["monthlycarbon", "dailycarbon", "carbon"];

      if (lessIsBetter.includes(typeKey)) {
          return progress >= 1; // For carbon-type, progress hits 1 when stat is low enough
      }
      return progress >= 1; // For all others, progress hits 1 when stat >= requirement
  }


    // Certificates & rewards with progress
  static async getUserCertificates(userId) {
    const stats = await this.computeUserStats(userId);
    const { totals, activities, monthlyStats } = stats;
    const mergedStats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const userCerts = await UserCertificate.find({ userId }).populate("certificateId");
    const allCerts = await Certificate.find();

    return allCerts.map(cert => {
        const unlocked = userCerts.find(uc => uc.certificateId && String(uc.certificateId._id) === String(cert._id));
        const req = this.parseRequirement(cert.requirement || cert.unlockRequirement);
        const progress = req ? this.computeProgress(req, mergedStats) : 0;
    
        return {
            id: cert._id,
            title: cert.title,
            body: cert.body || cert.description,
            icon: cert.icon,
            color: cert.color,
            earned: !!unlocked,
            unlockedAt: unlocked?.unlockedAt || null,
            progress: Number((progress * 100).toFixed(1))
        };
    });
  }

  static async getUserRewards(userId) {
    const stats = await this.computeUserStats(userId);
    const { totals, activities, monthlyStats } = stats;
    const mergedStats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const userRewards = await UserReward.find({ userId }).populate("rewardId");
    const allRewards = await Reward.find();
    const map = new Map(userRewards.filter(ur => ur.rewardId).map(ur => [String(ur.rewardId._id), ur]));

    return allRewards.map(r => {
        const ur = map.get(String(r._id));
        const req = this.parseRequirement(r.requirement || r.claimRequirement);
        const progress = req ? this.computeProgress(req, mergedStats) : 0;
    
        return {
            id: String(r._id),
            title: r.title,
            body: r.body || r.description,
            icon: r.icon,
            color: r.color,
            rewardItem: r.rewardItem,
            rewardType: r.rewardType,
            claimed: ur ? ur.status === "claimed" : false,
            claimable: ur ? ur.status === "claimable" : false,
            userRewardId: ur ? String(ur._id) : null,
            claimRequirement: r.claimRequirement || (r.requirement ? `${r.requirement.type}_${r.requirement.value}` : ""),
            progress: Number((progress * 100).toFixed(1))
        };
    });
  }

  
}

module.exports = CertificateRewardService;
