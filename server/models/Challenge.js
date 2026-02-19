const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dailyChallenges: [
    {
      id: {
        type: String,
        required: true,
      },
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      category: {
        type: String,
        enum: ["transport", "home", "food"],
        required: true,
      },
      calculationType: {
        type: String,
        enum: ["override", "fixed_credit"],
        required: true,
      },
      savingsValue: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
      targetQuestion: String,
      overrideValue: String,
      completed: {
        type: Boolean,
        default: false,
      },
      completedAt: {
        type: Date,
      },
    },
  ],
  dailyTrackingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DailyTracking",
  },
  isRecalculated: {
    type: Boolean,
    default: false,
  },
  calculationHistory: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      footprint: Number,
      source: {
        type: String,
        enum: ["initial", "challenge_completion"],
        required: true,
      },
      challengeId: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

challengeSchema.index({ userId: 1, date: -1 });
challengeSchema.index({ userId: 1, createdAt: -1 });

challengeSchema.index({ userId: 1, date: 1 }, { unique: true });

challengeSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

challengeSchema.methods.getCompletedCount = function () {
  return this.dailyChallenges.filter((challenge) => challenge.completed).length;
};

challengeSchema.methods.areAllCompleted = function () {
  return this.dailyChallenges.length === 3 && this.getCompletedCount() === 3;
};

challengeSchema.virtual("dateString").get(function () {
  return this.date.toISOString().split("T")[0];
});

module.exports = mongoose.model("Challenge", challengeSchema);
