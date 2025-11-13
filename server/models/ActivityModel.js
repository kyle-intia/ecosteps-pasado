const mongoose = require("mongoose");

const pointSchema = new mongoose.Schema({
  latitude: Number,
  longitude: Number,
  timestamp: Date,
});

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    category: { type: String, enum: ["private","public","basic"], required: true },
    subtype: { type: String, required: true },
    points: [pointSchema],
    totalDistance: Number,
    duration: Number,
isImported: {
  type: Boolean,
  default: false,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
