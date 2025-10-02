// server/models/Notification.js - Notification history model
const mongoose = require('mongoose');

const notificationAchievementsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['achievement_unlock', 'streak_milestone', 'challenge_complete'],
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  achievementId: { type: String, ref: 'Achievement' },
  data: {
    icon: String,
    category: String,
    tier: String,
    points: Number
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationAchievementsSchema.index({ userId: 1, createdAt: -1 });
notificationAchievementsSchema.index({ userId: 1, isRead: 1 });

const NotificationAchievements = mongoose.model('NotificationAchivements', notificationAchievementsSchema);

module.exports = NotificationAchievements;