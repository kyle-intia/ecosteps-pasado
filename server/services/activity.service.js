const Activity = require("../models/activity.model");

// Create activity (already done)
exports.createActivity = async (userId, activityData) => {
  try {
    const newActivity = new Activity({
      ...activityData,
      userId,
    });
    return await newActivity.save();
  } catch (err) {
    throw new Error("Error creating activity: " + err.message);
  }
};

// Get today's activities (already done)
exports.getTodayActivities = async (userId) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return await Activity.find({
      userId,
      createdAt: { $gte: today, $lt: tomorrow },
    }).sort({ createdAt: -1 });
  } catch (err) {
    throw new Error("Error fetching today's activities: " + err.message);
  }
};

// Update activity completely (PUT)
exports.updateActivity = async (userId, activityId, activityData) => {
  try {
    const updated = await Activity.findOneAndUpdate(
      { id: activityId, userId },
      activityData,
      { new: true, runValidators: true } // return updated document and validate
    );
    return updated; // null if not found
  } catch (err) {
    throw new Error("Error updating activity: " + err.message);
  }
};

// Partially update activity (PATCH)
exports.patchActivity = async (userId, activityId, updates) => {
  try {
    const patched = await Activity.findOneAndUpdate(
      { id: activityId, userId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    return patched; // null if not found
  } catch (err) {
    throw new Error("Error patching activity: " + err.message);
  }
};

// Delete activity
exports.deleteActivity = async (userId, activityId) => {
  try {
    const deleted = await Activity.findOneAndDelete({ id: activityId, userId });
    return deleted; // null if not found
  } catch (err) {
    throw new Error("Error deleting activity: " + err.message);
  }
};
