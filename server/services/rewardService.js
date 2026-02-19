const Reward = require("../models/rewardModel");
const UserReward = require("../models/userRewardModel");
const Activity = require("../models/activity.model");

class RewardService {
  static async getAllRewards(userId) {
    const rewards = await Reward.find();
    const userClaims = await UserReward.find({ userId });

    return rewards.map((r) => ({
      ...r._doc,
      claimed: userClaims.some((u) => u.rewardId === r._id.toString()),
    }));
  }

  static async claimReward(userId, rewardId) {
    const alreadyClaimed = await UserReward.findOne({ userId, rewardId });
    if (alreadyClaimed) return null;

    const reward = await Reward.findById(rewardId);
    if (!reward) return null;

    const activities = await Activity.find({ userId });

    let total = 0;
    if (reward.requirement.type === "walk") {
      total = activities
        .filter((a) => a.subtype === "walk")
        .reduce((sum, a) => sum + (a.totalDistance || 0), 0);
    }

    if (reward.requirement.type === "bike") {
      total = activities
        .filter((a) => a.subtype === "bike")
        .reduce((sum, a) => sum + (a.totalDistance || 0), 0);
    }

    if (total < reward.requirement.value) return false;

    const claim = new UserReward({
      userId,
      rewardId,
      claimedAt: new Date(),
    });

    await claim.save();
    return claim;
  }
}

module.exports = RewardService;
