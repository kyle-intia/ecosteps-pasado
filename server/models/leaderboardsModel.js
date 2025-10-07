const mongoose = require("mongoose");

const tierEnum = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];

const leaderboardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  tier: {
    type: String,
    enum: tierEnum,
    default: "Bronze",
  },
  ecoScore: {
    type: Number,
    default: 0,
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
    max: 2000,
  },
  totalScore: {
    type: Number,
    default: 0, // lifetime accumulated points
  },
  rank: {
    type: Number,
    default: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  lastDailyCommunityPointsDate: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
