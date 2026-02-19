const ChallengeService = require("../services/challengeService");

const requireDailyTracking = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
      });
    }

    const hasTracking =
      await ChallengeService.hasCompletedDailyTracking(userId);

    if (!hasTracking) {
      return res.status(400).json({
        error: "Daily tracking required",
        message:
          "You must complete your daily tracking before accessing eco-challenges",
        code: "TRACKING_REQUIRED",
      });
    }

    next();
  } catch (error) {
    console.error("Error in requireDailyTracking middleware:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
};

const addTrackingStatus = async (req, res, next) => {
  try {
    const userId = req.userId;

    if (userId) {
      const hasTracking =
        await ChallengeService.hasCompletedDailyTracking(userId);
      req.hasCompletedTracking = hasTracking;
    }

    next();
  } catch (error) {
    console.error("Error in addTrackingStatus middleware:", error);
    next();
  }
};

module.exports = {
  requireDailyTracking,
  addTrackingStatus,
};
