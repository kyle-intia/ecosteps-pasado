const Reward = require("../models/rewardModel");

class AdminRewardService {
  static async createReward(data) {
    const reward = new Reward(data);
    return reward.save();
  }

  static async getAllRewards() {
    return Reward.find().sort({ createdAt: -1 });
  }

  static async getRewardById(id) {
    return Reward.findById(id);
  }

  static async updateReward(id, updates) {
    return Reward.findByIdAndUpdate(id, updates, { new: true });
  }

  static async deleteReward(id) {
    return Reward.findByIdAndDelete(id);
  }
}

module.exports = AdminRewardService;
