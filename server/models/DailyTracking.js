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
  transport: {
    modes: [{
      id: {
        type: String,
        enum: ['car', 'public_transport', 'motorcycle', 'bicycle', 'walking', 'no_travel'],
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
      min: 1,
      max: 20
    },
    appliances: [{
      type: String,
      enum: ['ac_heating', 'heating_only', 'laundry', 'none']
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
    }
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

// Pre-save middleware to update the updatedAt field
dailyTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
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

module.exports = mongoose.model('DailyTracking', dailyTrackingSchema);