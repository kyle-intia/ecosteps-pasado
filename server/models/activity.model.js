const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // not required if you’ll fill it server-side
    category: { type: String, enum: ["transport", "home", "food"], required: true },

    transportGroup: String,
    subtype: String,
    distanceKm: Number,

    homeType: String,
    occupants: Number,
    appliances: String,

    mealSlot: String,
    mealType: String,
    description: String,

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);


module.exports = mongoose.model("ActivityLogs", activitySchema);
