// server/models/DailyTracking.js
// Updated MongoDB model for daily tracking with challenge integration fields

const mongoose = require('mongoose');

const dailyTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  // Store original user answers for recalculation
  rawAnswers: {
    type: mongoose.Schema.Types.Mixed,
    required: false // Make optional since it's set in pre-save
  },
  transport: {
    modes: [{
      id: {
        type: String,
        enum: ['diesel', 'gasoline', 'hybrid', 'electric', 'motorcycle', 'tricycle', "jeep", "e-jeep", 'train', 'bicycle', 'walk', 'no_travel'],
        required: true
      },
      distance: {
        type: Number,
        min: 0,
        default: 0
      }
    }],
    flightType: {
      type: String,
      enum: ['long_haul', 'short_haul', 'no_flight'],
      default: 'no_flight'
    }
  },
  homeEnergy: {
    homeType: {
      type: String,
      enum: ['large_house', 'small_house', 'apartment'],
      required: true
    },
    occupants: {
      type: Number,
      required: true,
      min: 0,
      max: 20
    },
    appliances: [{
      type: String,
      enum: ['ac_heating', 'heating_only', 'laundry', 'aircon', 'none']
    }]
  },
  food: {
    breakfast: {
      type: String,
      enum: ['meat', 'fish', 'dairy', 'mixed', 'plant', 'skipped'],
      required: true
    },
    lunch: {
      type: String,
      enum: ['meat', 'fish', 'dairy', 'mixed', 'plant', 'skipped'],
      required: true
    },
    dinner: {
      type: String,
      enum: ['meat', 'fish', 'dairy', 'mixed', 'plant', 'skipped'],
      required: true
    },
    breakfastFood:{type: String},
    lunchFood:{type: String},
    dinnerFood:{type: String}
  },
  calculatedFootprint: {
    transport: {
      type: Number,
      required: true,
      min: 0
    },
    homeEnergy: {
      type: Number,
      required: true,
      min: 0
    },
    food: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  },
  // Challenge integration fields
  isRecalculated: {
    type: Boolean,
    default: false
  },
  appliedChallenges: [{
    challengeId: String,
    appliedAt: {
      type: Date,
      default: Date.now
    },
    savingsAmount: Number
  }],
  calculationHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    footprint: {
      transport: Number,
      homeEnergy: Number,
      food: Number,
      total: Number
    },
    source: {
      type: String,
      enum: ['initial', 'challenge_recalculation'],
      required: true
    },
    challengeId: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
dailyTrackingSchema.index({ userId: 1, date: -1 });
dailyTrackingSchema.index({ userId: 1, createdAt: -1 });

// Ensure only one entry per user per day
dailyTrackingSchema.index({ userId: 1, date: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field and store raw answers
dailyTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Store raw answers if not already stored
  if (!this.rawAnswers && this.isNew) {
    this.rawAnswers = {
      transport: this.transport,
      homeEnergy: this.homeEnergy,
      food: this.food,
      timestamp: new Date()
    };
  }
  
  next();
});

// Virtual for getting date in YYYY-MM-DD format
dailyTrackingSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to check if this is today's entry
dailyTrackingSchema.methods.isToday = function() {
  const today = new Date();
  const entryDate = new Date(this.date);
  return today.toDateString() === entryDate.toDateString();
};

// Method to get total savings from challenges
dailyTrackingSchema.methods.getTotalChallengeSavings = function() {
  return this.appliedChallenges.reduce((total, challenge) => {
    return total + (challenge.savingsAmount || 0);
  }, 0);
};

// Method to check if a challenge has been applied
dailyTrackingSchema.methods.hasChallengeApplied = function(challengeId) {
  return this.appliedChallenges.some(challenge => challenge.challengeId === challengeId);
};

// Method to add calculation history entry
dailyTrackingSchema.methods.addCalculationHistory = function(footprint, source, challengeId = null) {
  this.calculationHistory.push({
    timestamp: new Date(),
    footprint: footprint,
    source: source,
    challengeId: challengeId
  });
};

module.exports = mongoose.model('DailyTracking', dailyTrackingSchema);