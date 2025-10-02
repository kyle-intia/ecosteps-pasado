const UserSettings = require('../models/userSettingsModel');

class UserSettingsService {
  static async getSettingsByUserId(userId) {
    let settings = await UserSettings.findOne({ userId });
    if (!settings) {
      settings = await UserSettings.create({ userId });
    }
    return settings;
  }

  static async updateSettings(userId, updates) {
    const updatedSettings = await UserSettings.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );
    return updatedSettings;
  }
}

module.exports = UserSettingsService;
