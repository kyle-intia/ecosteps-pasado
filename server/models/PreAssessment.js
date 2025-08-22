const mongoose = require('mongoose');

const preAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  responses: {
    Q1_modes: [{
      type: String,
      enum: ['Personal Car', 'Walking/Biking/E-bike', 'Public Transport', 'Motorcycle', 'Work from Home'],
      required: true
    }],
    Q2_kmPerDay: {
      type: Number,
      required: true,
      min: 0
    },
    Q3_flightsPerYear: {
      type: Number,
      required: true,
      min: 0
    },
    Q4_homeType: {
      type: String,
      enum: ['Large House', 'Small House', 'Apartment'],
      required: true
    },
    Q5_residents: {
      type: Number,
      required: true,
      min: 1
    },
    Q6_billRange: {
      type: String,
      enum: ['<7500', '7501-12000', '12001-25000', '>25000'],
      required: true
    },
    Q7_hasRenewables: {
      type: Boolean,
      required: true
    },
    Q8_dietType: {
      type: String,
      enum: ['High Meat', 'Moderate Meat', 'Low Meat', 'Pescatarian', 'Vegan/Vegetarian'],
      required: true
    }
  },
  results: {
    sectionA: {
      type: Number,
      required: true,
      min: 0
    },
    sectionB: {
      type: Number,
      required: true,
      min: 0
    },
    sectionC: {
      type: Number,
      required: true,
      min: 0
    },
    totalCO2: {
      type: Number,
      required: true,
      min: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
preAssessmentSchema.index({ userId: 1 });
preAssessmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PreAssessment', preAssessmentSchema);
