const mongoose = require("mongoose");

const UserRewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Reward",
    },
    claimableAt: { type: Date },
    claimedAt: { type: Date },
    status: {
      type: String,
      enum: ["locked", "claimable", "claimed"],
      default: "locked",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserReward", UserRewardSchema);
