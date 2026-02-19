const mongoose = require("mongoose");

const dailyTrackingSchema = new mongoose.Schema({
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
  rawAnswers: {
    type: mongoose.Schema.Types.Mixed,
    required: false,
  },
  transport: {
    modes: [
      {
        id: {
          type: String,
          enum: [
            "diesel",
            "gasoline",
            "hybrid",
            "electric",
            "motorcycle",
            "tricycle",
            "jeep",
            "e-jeep",
            "train",
            "bicycle",
            "walk",
            "no_travel",
          ],
          required: true,
        },
        distance: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],
    flightType: {
      type: String,
      enum: ["long_haul", "short_haul", "no_flight"],
      default: "no_flight",
    },
  },
  homeEnergy: {
    homeType: {
      type: String,
      enum: ["large_house", "small_house", "apartment"],
      required: true,
    },
    occupants: {
      type: Number,
      required: true,
      min: 0,
      max: 20,
    },
    appliances: [
      {
        type: String,
        enum: ["ac_heating", "heating_only", "laundry", "aircon", "none"],
      },
    ],
  },
  food: {
    breakfast: {
      type: String,
      enum: ["meat", "fish", "dairy", "mixed", "plant", "skipped"],
      required: true,
    },
    lunch: {
      type: String,
      enum: ["meat", "fish", "dairy", "mixed", "plant", "skipped"],
      required: true,
    },
    dinner: {
      type: String,
      enum: ["meat", "fish", "dairy", "mixed", "plant", "skipped"],
      required: true,
    },
    breakfastFood: { type: String },
    lunchFood: { type: String },
    dinnerFood: { type: String },
  },
  calculatedFootprint: {
    transport: {
      type: Number,
      required: true,
      min: 0,
    },
    homeEnergy: {
      type: Number,
      required: true,
      min: 0,
    },
    food: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  isRecalculated: {
    type: Boolean,
    default: false,
  },
  appliedChallenges: [
    {
      challengeId: String,
      appliedAt: {
        type: Date,
        default: Date.now,
      },
      savingsAmount: Number,
    },
  ],
  calculationHistory: [
    {
      timestamp: {
        type: Date,
        default: Date.now,
      },
      footprint: {
        transport: Number,
        homeEnergy: Number,
        food: Number,
        total: Number,
      },
      source: {
        type: String,
        enum: ["initial", "challenge_recalculation"],
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

dailyTrackingSchema.index({ userId: 1, date: -1 });
dailyTrackingSchema.index({ userId: 1, createdAt: -1 });

dailyTrackingSchema.index({ userId: 1, date: 1 }, { unique: true });

dailyTrackingSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  if (!this.rawAnswers && this.isNew) {
    this.rawAnswers = {
      transport: this.transport,
      homeEnergy: this.homeEnergy,
      food: this.food,
      timestamp: new Date(),
    };
  }

  next();
});

dailyTrackingSchema.virtual("dateString").get(function () {
  return this.date.toISOString().split("T")[0];
});

dailyTrackingSchema.methods.isToday = function () {
  const today = new Date();
  const entryDate = new Date(this.date);
  return today.toDateString() === entryDate.toDateString();
};

dailyTrackingSchema.methods.getTotalChallengeSavings = function () {
  return this.appliedChallenges.reduce((total, challenge) => {
    return total + (challenge.savingsAmount || 0);
  }, 0);
};

dailyTrackingSchema.methods.hasChallengeApplied = function (challengeId) {
  return this.appliedChallenges.some(
    (challenge) => challenge.challengeId === challengeId,
  );
};

dailyTrackingSchema.methods.addCalculationHistory = function (
  footprint,
  source,
  challengeId = null,
) {
  this.calculationHistory.push({
    timestamp: new Date(),
    footprint: footprint,
    source: source,
    challengeId: challengeId,
  });
};

module.exports = mongoose.model("DailyTracking", dailyTrackingSchema);
