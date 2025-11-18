const Activity = require("../models/activity.model");
const Certificate = require("../models/certificateModel");
const Reward = require("../models/rewardModel");
const UserCertificate = require("../models/userCertificateModel");
const UserReward = require("../models/userRewardModel");
const { getUserStats, getMonthlyStats } = require("./stats.service");

class CertificateRewardService {

  // Compute user stats including totals, points, and daily/monthly stats
  static async computeUserStats(userId) {
    const activities = await Activity.find({ userId });

    const totals = { dates: [], points: 0, totalDistance: 0 };

    // Detect subtypes dynamically
    const subtypes = new Set(activities.map(a => a.subtype));
    if (subtypes.has("walk")) totals.walk = 0;
    if (subtypes.has("bike")) totals.bike = 0;
    if (subtypes.has("car")) totals.car = 0;

    activities.forEach(a => {
      if (a.distanceKm && totals.hasOwnProperty(a.subtype)) {
        totals[a.subtype] += a.distanceKm;
        totals.totalDistance += a.distanceKm;
      }
      totals.points += Number(a.points || 0);
      if (a.createdAt) totals.dates.push(a.createdAt.toISOString().split("T")[0]);
    });

    totals.dates.sort();

    const dailyStats = await getUserStats(userId, 7);
    const monthlyStats = await getMonthlyStats(userId);

    return { totals, activities, dailyStats, monthlyStats };
  }

  // Compute consecutive streak ending today
  static computeStreak(datesSorted) {
    if (!datesSorted || datesSorted.length === 0) return 0;

    const todayStr = new Date().toISOString().slice(0,10);
    const dateSet = new Set(datesSorted);

    let current = new Date();
    if (!dateSet.has(todayStr)) current = new Date(datesSorted[datesSorted.length - 1]);

    let streak = 0;
    while (true) {
      const day = current.toISOString().slice(0,10);
      if (dateSet.has(day)) {
        streak += 1;
        current.setDate(current.getDate() - 1);
      } else break;
    }
    return streak;
  }

  // Parse requirement (structured or legacy string)
  static parseRequirement(objOrString) {
    if (!objOrString) return null;
    if (typeof objOrString === "string") {
      const parts = objOrString.split("_");
      if (parts.length === 2) return { type: parts[0], value: Number(parts[1]) };
      return null;
    }
    if (typeof objOrString === "object" && objOrString.type) {
      return { type: objOrString.type, value: Number(objOrString.value || 0) };
    }
    return null;
  }

  // Check if requirement is satisfied by stats
  static requirementSatisfied(requirement, stats) {
    if (!requirement) return false;
    const { type, value } = requirement;

    if (type === "walk") return (stats.walk || 0) >= value;
    if (type === "bike") return (stats.bike || 0) >= value;
    if (type === "car") return (stats.car || 0) >= value;
    if (type === "totalDistance") return (stats.totalDistance || 0) >= value;
    if (type === "points" || type === "carbon") return (stats.points || 0) >= value;
    if (type === "streak") return this.computeStreak(stats.dates) >= value;
    if (type === "monthlyCarbon") return (stats.monthlyStats?.averageFootprint || 0) <= value;

    return false;
  }

  // Check and award certificates
  static async checkCertificatesForUser(userId) {
    const { totals, activities, monthlyStats } = await this.computeUserStats(userId);
    const stats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const certificates = await Certificate.find();
    const newlyUnlocked = [];

    for (const cert of certificates) {
      const exists = await UserCertificate.findOne({ userId, certificateId: cert._id });
      if (exists) continue;

      const req = this.parseRequirement(cert.requirement || cert.unlockRequirement);
      if (!req) continue;

      if (this.requirementSatisfied(req, stats)) {
        const doc = new UserCertificate({ userId, certificateId: cert._id, unlockedAt: new Date() });
        await doc.save();
        newlyUnlocked.push({ certificate: cert, earnedAt: doc.unlockedAt });
      }
    }
    return newlyUnlocked;
  }

  // Check and mark rewards claimable
  static async checkRewardsForUser(userId) {
    const { totals, activities, monthlyStats } = await this.computeUserStats(userId);
    const stats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const rewards = await Reward.find();
    const newlyClaimable = [];

    for (const r of rewards) {
      const req = this.parseRequirement(r.requirement || r.claimRequirement);
      const existing = await UserReward.findOne({ userId, rewardId: r._id });

      if (existing?.status === "claimed") continue;

      if (req && this.requirementSatisfied(req, stats)) {
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

  // Run all checks
  static async runAllChecksForUser(userId) {
    const certs = await this.checkCertificatesForUser(userId);
    const rewards = await this.checkRewardsForUser(userId);
    return { certificates: certs, rewards };
  }

  // Claim a reward
  static async claimReward(userId, rewardId) {
    const ur = await UserReward.findOne({ userId, rewardId });
    if (!ur) return { ok: false, code: "not_found" };
    if (ur.status !== "claimable") return { ok: false, code: "not_claimable" };

    ur.status = "claimed";
    ur.claimedAt = new Date();
    await ur.save();

    return { ok: true, claimedAt: ur.claimedAt };
  }

  // Fetch user certificates with progress
  static async getUserCertificates(userId) {
    const { totals, activities, monthlyStats } = await this.computeUserStats(userId);
    const stats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const userCerts = await UserCertificate.find({ userId }).populate("certificateId");
    const allCerts = await Certificate.find();

    return allCerts.map(cert => {
      const unlocked = userCerts.find(uc => uc.certificateId && String(uc.certificateId._id) === String(cert._id));
      const req = this.parseRequirement(cert.requirement || cert.unlockRequirement);

      let progress = 0;
      if (req) {
        if (req.type === "streak") progress = Math.min(this.computeStreak(stats.dates) / req.value, 1);
        else if (req.type === "monthlyCarbon") progress = Math.min((stats.monthlyStats?.averageFootprint || 0) / req.value, 1);
        else progress = Math.min((stats[req.type] || 0) / req.value, 1);
      }

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

  // Fetch user rewards with progress
  static async getUserRewards(userId) {
    const { totals, activities, monthlyStats } = await this.computeUserStats(userId);
    const stats = { ...totals, activities, monthlyStats, dates: totals.dates };

    const userRewards = await UserReward.find({ userId }).populate("rewardId");
    const allRewards = await Reward.find();

    const map = new Map();
    for (const ur of userRewards) if (ur.rewardId) map.set(String(ur.rewardId._id), ur);

    return allRewards.map(r => {
      const ur = map.get(String(r._id));
      const req = this.parseRequirement(r.requirement || r.claimRequirement);

      let progress = 0;
      if (req) {
        if (req.type === "streak") progress = Math.min(this.computeStreak(stats.dates) / req.value, 1);
        else if (req.type === "monthlyCarbon") progress = Math.min((stats.monthlyStats?.averageFootprint || 0) / req.value, 1);
        else progress = Math.min((stats[req.type] || 0) / req.value, 1);
      }

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
