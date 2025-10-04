const mongoose = require("mongoose");

const badgeAchievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  tier: { type: String, required: true },
  icon: { type: String, required: true },
  targetValue: { type: Number, required: true },
  triggerEvent: { type: String, required: true },
  unlockCondition: { type: String, required: true },
  profilePriority: { type: Number, required: true },
  notificationPriority: { type: String, required: true }
}, { timestamps: true });

const badgeAchievementModel = mongoose.model("badge_achievement", badgeAchievementSchema);

module.exports = badgeAchievementModel;
