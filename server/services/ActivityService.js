const Activity = require("../models/ActivityModel");

class ActivityService {
  static async createActivity(data) {
    const activity = new Activity(data);
    await activity.save();
    return activity;
  }

  static async getUserActivities(userId, filter = {}) {
    return Activity.find({ userId, ...filter }).sort({ createdAt: -1 });
  }
}

module.exports = ActivityService;
