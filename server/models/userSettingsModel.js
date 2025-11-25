const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  emailNotification: { type: Boolean, default: false },
  pushNotification: { type: Boolean, default: false },
  communityUpdates: { type: Boolean, default: false },
  carbonReminder: { type: Boolean, default: false }, 
  pushSubscription: { type: Object },
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
module.exports = UserSettings;
