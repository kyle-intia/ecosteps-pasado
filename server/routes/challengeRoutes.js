const express = require("express");
const router = express.Router();
const ChallengeService = require("../services/challengeService");
const authenticate = require("../middleware/authenticate");
const EmissionFactorService = require("../services/emissionFactorService");
const DailyTrackingService = require("../services/dailyTrackingService");
const LeaderboardService = require("../services/leaderboardService");
const CertificateRewardService = require("../services/certificateRewardService");
const AchievementService = require("../services/achievementService");

router.use(authenticate);

router.get("/today", async (req, res) => {
  try {
    const userId = req.userId;
    const challengeDoc = await ChallengeService.getTodaysChallenges(userId);

    const responseData = {
      date: challengeDoc.dateString,
      challenges: challengeDoc.dailyChallenges.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        savingsValue: challenge.savingsValue,
        completed: challenge.completed,
        completedAt: challenge.completedAt,
      })),
      completedCount: challengeDoc.getCompletedCount(),
      allCompleted: challengeDoc.areAllCompleted(),
      isRecalculated: challengeDoc.isRecalculated,
      hasCompletedTracking: challengeDoc.hasCompletedTracking,
      trackingRequired: challengeDoc.trackingRequired,
    };

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error fetching today's challenges:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post("/complete", async (req, res) => {
  try {
    const co2Factors = await EmissionFactorService.getFormattedFactors();
    DailyTrackingService.init(co2Factors);

    const userId = req.userId;
    const { challengeId } = req.body;

    if (!challengeId) {
      return res.status(400).json({
        error: "Challenge ID is required",
      });
    }

    const result = await ChallengeService.completeChallenge(
      userId,
      challengeId,
    );

    await LeaderboardService.addPoints(
      userId,
      100,
      "Completed a daily challenge",
    );

    await CertificateRewardService.checkCertificatesForUser(userId);
    await CertificateRewardService.checkRewardsForUser(userId);
    await AchievementService.checkAchievements(
      userId,
      "daily_tracking_completed",
    );

    res.json({
      success: true,
      data: {
        challengeId,
        completed: true,
        completedCount: result.completedCount,
        allCompleted: result.allCompleted,
        recalculation: result.recalculationResult,
        newAchievements: result.newAchievements || [],
        message: result.allCompleted
          ? "Congratulations! You completed all three challenges today!"
          : `Challenge complete! You earned 100 points. Great job! ${result.completedCount}/3 challenges completed.`,
      },
    });
  } catch (error) {
    console.error("Error completing challenge:", error);

    if (error.message === "Challenge not found") {
      return res.status(404).json({ error: "Challenge not found" });
    }

    if (error.message === "Challenge already completed") {
      return res.status(400).json({ error: "Challenge already completed" });
    }

    if (error.message.includes("daily tracking")) {
      return res.status(400).json({
        error: "Daily tracking required",
        message: error.message,
        code: "TRACKING_REQUIRED",
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 30, offset = 0 } = req.query;

    const Challenge = require("../models/Challenge");

    const challengeDocs = await Challenge.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select("date dailyChallenges isRecalculated createdAt");

    const history = challengeDocs.map((doc) => ({
      id: doc._id,
      date: doc.dateString,
      challenges: doc.dailyChallenges.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        completed: c.completed,
        completedAt: c.completedAt,
      })),
      completedCount: doc.getCompletedCount(),
      allCompleted: doc.areAllCompleted(),
      isRecalculated: doc.isRecalculated,
      createdAt: doc.createdAt,
    }));

    res.json({
      success: true,
      data: {
        count: history.length,
        history: history,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge history:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const stats = await ChallengeService.getChallengeStats(
      userId,
      parseInt(days),
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching challenge stats:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/library", async (req, res) => {
  try {
    const ChallengeService = require("../services/challengeService");

    const challenges = Object.values(
      ChallengeService.constructor.CHALLENGE_LIBRARY || {},
    );

    res.json({
      success: true,
      data: {
        totalChallenges: challenges.length,
        categories: {
          transport: challenges.filter((c) => c.category === "transport")
            .length,
          home: challenges.filter((c) => c.category === "home").length,
          food: challenges.filter((c) => c.category === "food").length,
        },
        challenges: challenges,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge library:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post("/regenerate", async (req, res) => {
  try {
    const userId = req.userId;
    const challengeDoc =
      await ChallengeService.regenerateTodaysChallenges(userId);

    const responseData = {
      date: challengeDoc.dateString,
      challenges: challengeDoc.dailyChallenges.map((challenge) => ({
        id: challenge.id,
        title: challenge.title,
        description: challenge.description,
        category: challenge.category,
        savingsValue: challenge.savingsValue,
        completed: challenge.completed,
        completedAt: challenge.completedAt,
      })),
      completedCount: challengeDoc.getCompletedCount(),
      allCompleted: challengeDoc.areAllCompleted(),
      isRecalculated: challengeDoc.isRecalculated,
      hasCompletedTracking: challengeDoc.hasCompletedTracking,
      trackingRequired: challengeDoc.trackingRequired,
    };

    res.json({
      success: true,
      data: responseData,
      message: "Challenges regenerated successfully",
    });
  } catch (error) {
    console.error("Error regenerating challenges:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.post("/check-tracking-status", async (req, res) => {
  try {
    const userId = req.userId;
    const hasTracking =
      await ChallengeService.hasCompletedDailyTracking(userId);

    res.json({
      success: true,
      data: {
        hasCompletedTracking: hasTracking,
        canCompleteChallenges: hasTracking,
      },
    });
  } catch (error) {
    console.error("Error checking tracking status:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

module.exports = router;
