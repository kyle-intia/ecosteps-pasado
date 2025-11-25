const mongoose = require("mongoose");

const RewardSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  icon: { type: String }, 
  color: { type: String },

  rewardItem: { type: String, required: true },

  rewardType: {
    type: String,
    enum: ["physical", "digital", "discount"],
    required: true,
  },

  claimed: { type: Boolean, default: false },
  
  claimRequirement: {
    type: { type: String, required: true }, 
    value: { type: Number, required: true },
  },

  claimable: { type: Boolean, default: false },

  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reward", RewardSchema);
