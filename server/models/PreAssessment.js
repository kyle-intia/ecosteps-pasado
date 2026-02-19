const mongoose = require("mongoose");

const preAssessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  responses: {
    Q1_primaryMode: {
      type: String,
      enum: [
        "Personal Car",
        "Motorcycle",
        "Public Transport",
        "Bicycle/E-bike",
        "Walking",
        "Work from Home",
      ],
      required: true,
    },
    Q2_kmPerDay: {
      type: Number,
      required: true,
      min: 0,
    },
    Q3_flightsPerYear: {
      type: Number,
      required: true,
      min: 0,
    },
    Q4_homeType: {
      type: String,
      enum: ["Large House", "Small House", "Apartment"],
      required: true,
    },
    Q5_residents: {
      type: Number,
      required: true,
      min: 1,
    },
    Q6_billRange: {
      type: String,
      enum: [
        "Below ₱7,500 / month",
        "₱7,501 – ₱12,000 / month",
        "₱12,001 – ₱25,000 / month",
        "Above ₱25,000 / month",
      ],
      required: true,
    },
    Q7_hasRenewables: {
      type: Boolean,
      required: true,
    },
    Q8_dietType: {
      type: String,
      enum: [
        "High meat intake (more than 3 times a week)",
        "Moderate meat intake (2–3 times a week)",
        "Low meat intake (about once a week)",
        "Pescetarian (fish but no meat)",
        "Vegetarian or Vegan (no meat or fish)",
      ],
      required: true,
    },
    Q9_travelContext: {
      type: String,
      enum: [
        "commute_fixed",
        "professional_driver",
        "delivery_rider",
        "remote_work",
        "non_standard_hours",
        "student",
        "other_context",
      ],
      required: false,
    },
    Q10_mobilityConsiderations: {
      type: [String],
      enum: [
        "respiratory",
        "wheelchair",
        "walking_difficulty",
        "heart_condition",
        "visual_impairment",
        "none_mobility",
      ],
      required: false,
      default: [],
    },
    Q10_mobilityDetails: {
      type: String,
      required: false,
      maxlength: 500,
    },
  },
  results: {
    sectionA: {
      type: Number,
      required: true,
      min: 0,
    },
    sectionB: {
      type: Number,
      required: true,
      min: 0,
    },
    sectionC: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCO2: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  assessmentDone: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

preAssessmentSchema.index({ userId: 1 });
preAssessmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("PreAssessment", preAssessmentSchema);
