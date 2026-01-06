const mongoose = require("mongoose");

const AssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["pre", "post"],
      required: true,
    },

    awarenessAnswers: {
      type: [Number], // Likert 1–5
      required: true,
    },

    behaviorAnswers: {
      type: [Number], // Likert 1–5
      required: true,
    },

    monthlyEmissions: {
      type: Number, // kg CO2
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assessment", AssessmentSchema);
