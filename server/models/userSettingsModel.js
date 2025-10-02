const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  emailNotification: { type: Boolean, default: true },
  pushNotification: { type: Boolean, default: true },
  communityUpdates: { type: Boolean, default: true },
  carbonReminder: { type: Boolean, default: true }, 
  pushSubscription: { type: Object },
}, { timestamps: true });

const UserSettings = mongoose.model('UserSettings', userSettingsSchema);
module.exports = UserSettings;
