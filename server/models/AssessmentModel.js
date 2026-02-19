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
      type: [Number],
      required: true,
    },

    behaviorAnswers: {
      type: [Number],
      required: true,
    },

    monthlyEmissions: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Assessment", AssessmentSchema);
