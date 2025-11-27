const activityService = require("../services/activity.service");
const CertificateRewardService = require('../services/certificateRewardService');
const AchievementService = require('../services/achievementService');

// Add new activity
exports.addActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const activityData = req.body;

    if (!activityData.id || !activityData.category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const saved = await activityService.createActivity(userId, activityData);

    // ADD THESE 3 LINES HERE TOO
    await CertificateRewardService.checkCertificatesForUser(userId);
    await CertificateRewardService.checkRewardsForUser(userId);
    await AchievementService.checkAchievements(userId, 'activity_completed', { activity: saved });
    
    return res.status(201).json(saved);
  } catch (err) {
    console.error("Add activity error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get today's activities
exports.getTodayActivities = async (req, res) => {
  try {
    const userId = req.userId;
    const activities = await activityService.getTodayActivities(userId);
    return res.status(200).json(activities);
  } catch (err) {
    console.error("Fetch today's activities error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update an activity completely (PUT)
exports.updateActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const activityId = req.params.id;
    const activityData = req.body;

    if (!activityData.category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const updated = await activityService.updateActivity(userId, activityId, activityData);
    if (!updated) {
      return res.status(404).json({ error: "Activity not found" });
    }

    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update activity error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Partially update an activity (PATCH)
exports.patchActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const activityId = req.params.id;
    const updates = req.body;

    const patched = await activityService.patchActivity(userId, activityId, updates);
    if (!patched) {
      return res.status(404).json({ error: "Activity not found" });
    }

    return res.status(200).json(patched);
  } catch (err) {
    console.error("Patch activity error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete an activity
exports.deleteActivity = async (req, res) => {
  try {
    const userId = req.userId;
    const activityId = req.params.id;

    const deleted = await activityService.deleteActivity(userId, activityId);
    if (!deleted) {
      return res.status(404).json({ error: "Activity not found" });
    }

    return res.status(200).json({ message: "Activity deleted successfully" });
  } catch (err) {
    console.error("Delete activity error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
