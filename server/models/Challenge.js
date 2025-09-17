// server/models/Challenge.js
// MongoDB model for storing user's daily challenges and completion status

const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
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
  dailyChallenges: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['transport', 'home', 'food'],
      required: true
    },
    calculationType: {
      type: String,
      enum: ['override', 'fixed_credit'],
      required: true
    },
    savingsValue: {
      type: mongoose.Schema.Types.Mixed, // Can be number or "calculated"
      required: true
    },
    targetQuestion: String, // For override challenges
    overrideValue: String, // For override challenges
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date
    }
  }],
  dailyTrackingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DailyTracking'
  },
  isRecalculated: {
    type: Boolean,
    default: false
  },
  calculationHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    footprint: Number,
    source: {
      type: String,
      enum: ['initial', 'challenge_completion'],
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
challengeSchema.index({ userId: 1, date: -1 });
challengeSchema.index({ userId: 1, createdAt: -1 });

// Ensure only one challenge set per user per day
challengeSchema.index({ userId: 1, date: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
challengeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get completed challenges count
challengeSchema.methods.getCompletedCount = function() {
  return this.dailyChallenges.filter(challenge => challenge.completed).length;
};

// Method to check if all challenges are completed
challengeSchema.methods.areAllCompleted = function() {
  return this.dailyChallenges.length === 3 && this.getCompletedCount() === 3;
};

// Virtual for getting date in YYYY-MM-DD format
challengeSchema.virtual('dateString').get(function() {
  return this.date.toISOString().split('T')[0];
});

module.exports = mongoose.model('Challenge', challengeSchema);