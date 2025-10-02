// server/models/Achievement.js - Achievement definitions model
const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  achievementId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['daily', 'challenge', 'carbon', 'transport', 'home', 'food'] 
  },
  tier: { 
    type: String, 
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    required: true 
  },
  icon: { type: String, required: true },
  targetValue: { type: Number, default: 1 },
  triggerEvent: { 
    type: String, 
    enum: ['DAILY_TRACKING_COMPLETE', 'CHALLENGE_COMPLETE', 'PROFILE_VIEW'],
    required: true 
  },
  unlockCondition: { type: String, required: true },
  profilePriority: { type: Number, default: 5 },
  notificationPriority: { 
    type: String, 
    enum: ['low', 'medium', 'high'],
    default: 'medium' 
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

achievementSchema.index({ category: 1, tier: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);