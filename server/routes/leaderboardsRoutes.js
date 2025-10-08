const express = require("express");
const router = express.Router();
const LeaderboardService = require("../services/leaderboardService");
const authenticate = require("../middleware/authenticate");

// All routes require authentication
router.use(authenticate);

// GET top leaderboard users
router.get("/", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const leaderboard = await LeaderboardService.getLeaderboard(
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch leaderboard data",
    });
  }
});

// GET current user’s rank and points
router.get("/user", async (req, res) => {
  try {
    const userId = req.userId;
    const userInfo = await LeaderboardService.getUserLeaderboardInfo(userId);

    res.status(200).json({
      success: true,
      data: userInfo,
    });
  } catch (error) {
    console.error("User leaderboard fetch error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch user leaderboard data",
    });
  }
});

// POST manually trigger leaderboard rank recalculation
router.post("/recalculate", async (req, res) => {
  try {
    await LeaderboardService.updateRanks();
    res.status(200).json({
      success: true,
      message: "Leaderboard ranks recalculated successfully",
    });
  } catch (error) {
    console.error("Leaderboard recalculation error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to recalculate leaderboard ranks",
    });
  }
});

module.exports = router;
