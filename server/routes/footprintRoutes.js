const express = require("express");
const router = express.Router();
const DailyTracking = require("../models/DailyTracking");
const Challenge = require("../models/Challenge");
const DailyTrackingService = require("../services/dailyTrackingService");
const authenticate = require("../middleware/authenticate");
const EmissionFactorService = require("../services/emissionFactorService");
const LeaderboardService = require("../services/leaderboardService");
const NotificationService = require("../services/notificationService");
const CertificateRewardService = require("../services/certificateRewardService");
const AchievementService = require("../services/achievementService");

router.use(authenticate);

router.post("/submit", async (req, res) => {
  try {
    const co2Factors = await EmissionFactorService.getFormattedFactors();
    DailyTrackingService.init(co2Factors);

    const userId = req.userId;
    const trackingData = req.body;

    console.log("Footprint submission received for user:", userId);

    if (
      !trackingData.transport ||
      !trackingData.homeEnergy ||
      !trackingData.food
    ) {
      return res.status(400).json({
        success: false,
        error: "Missing required tracking data",
        message:
          "Please fill out all sections: transport, home energy, and food",
      });
    }

    const normalizeFoodValue = (value) => {
      const v = (value || "").replace("-", "_");
      if (v === "none") return "skipped";
      if (v === "plant_based") return "plant";
      return v;
    };

    const normalizedFood = {
      breakfast: normalizeFoodValue(trackingData.food.breakfast),
      lunch: normalizeFoodValue(trackingData.food.lunch),
      dinner: normalizeFoodValue(trackingData.food.dinner),
    };

    const transformTransportData = (transportData) => {
      const modes = Array.isArray(transportData.modes)
        ? transportData.modes
        : [];
      const distances = transportData.distances || {};

      const transformedModes = modes
        .map((mode) => {
          if (typeof mode === "string") {
            return {
              id: mode,
              distance: distances[mode] || 0,
            };
          } else if (typeof mode === "object" && mode && mode.id) {
            return {
              id: mode.id,
              distance: mode.distance || distances[mode.id] || 0,
            };
          }
          return null;
        })
        .filter(Boolean);

      return {
        modes: transformedModes,
        flightType: trackingData.flightsToday || "none",
      };
    };

    const transformHomeEnergyData = (homeEnergyData) => {
      const appliances = Array.isArray(homeEnergyData.appliances)
        ? homeEnergyData.appliances
        : [];
      const normalizedAppliances = appliances.map((appliance) => {
        if (appliance === "aircon") return "ac_heating";
        if (appliance === "laundry") return "laundry";
        if (appliance === "none") return "none";
        return appliance;
      });

      return {
        homeType: homeEnergyData.homeType,
        occupants: homeEnergyData.occupants,
        appliances: normalizedAppliances,
      };
    };

    const transformedTransport = transformTransportData(trackingData.transport);
    const transformedHomeEnergy = transformHomeEnergyData(
      trackingData.homeEnergy,
    );
    const email = req.email;

    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    const isUpdate = !!existingEntry;

    const calculatedFootprint = DailyTrackingService.calculateDailyFootprint({
      transport: trackingData.transport,
      flightType: trackingData.flightsToday || "no_flight",
      homeType: trackingData.homeEnergy.homeType,
      occupants: trackingData.homeEnergy.occupants,
      appliances: trackingData.homeEnergy.appliances,
      breakfast: normalizedFood.breakfast,
      lunch: normalizedFood.lunch,
      dinner: normalizedFood.dinner,
    });

    let savedEntry;

    if (existingEntry) {
      existingEntry.transport = trackingData.transport;
      existingEntry.homeEnergy = trackingData.homeEnergy;
      existingEntry.food = trackingData.food;
      existingEntry.calculatedFootprint = calculatedFootprint;
      existingEntry.updatedAt = new Date();

      existingEntry.rawAnswers = {
        transport: trackingData.transport,
        homeEnergy: trackingData.homeEnergy,
        food: trackingData.food,
        timestamp: new Date(),
      };

      savedEntry = await existingEntry.save();

      await DailyTrackingService.resetChallengesOnTrackingUpdate(userId);
    } else {
      const newEntry = new DailyTracking({
        userId: userId,
        date: today,
        transport: trackingData.transport,
        homeEnergy: trackingData.homeEnergy,
        food: trackingData.food,
        calculatedFootprint,
        rawAnswers: {
          transport: trackingData.transport,
          homeEnergy: trackingData.homeEnergy,
          food: trackingData.food,
          timestamp: new Date(),
        },
      });

      await LeaderboardService.addPoints(
        userId,
        100,
        "Completed a daily tracking",
      );

      await CertificateRewardService.checkCertificatesForUser(userId);
      await CertificateRewardService.checkRewardsForUser(userId);
      await AchievementService.checkAchievements(
        userId,
        "daily_tracking_completed",
      );

      savedEntry = await newEntry.save();
    }

    console.log("Footprint saved successfully:", savedEntry._id);

    res.json({
      success: true,
      data: {
        id: savedEntry._id,
        footprintId: savedEntry._id,
        isUpdate,
        calculatedFootprint,
        breakdown: {
          transport: calculatedFootprint.transport,
          homeEnergy: calculatedFootprint.homeEnergy,
          food: calculatedFootprint.food,
          total: calculatedFootprint.total,
        },
        context: {
          transportModes: trackingData.transport.modes || [],
          homeType: trackingData.homeEnergy.homeType,
          occupants: trackingData.homeEnergy.occupants,
          appliances: trackingData.homeEnergy.appliances || [],
          meals: {
            breakfast: normalizedFood.breakfast,
            lunch: normalizedFood.lunch,
            dinner: normalizedFood.dinner,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error submitting footprint:", error);

    if (error.message.includes("Invalid responses")) {
      return res.status(400).json({
        success: false,
        error: "Invalid tracking data",
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to save your carbon footprint. Please try again.",
    });
  }
});

router.post("/reset-daily", async (req, res) => {
  try {
    const userId = req.userId;

    console.log("Daily reset requested for user:", userId);

    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const resetResults = {
      footprintReset: false,
      challengesReset: false,
      recommendationsCleared: false,
    };

    const deletedFootprint = await DailyTracking.findOneAndDelete({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (deletedFootprint) {
      resetResults.footprintReset = true;
      console.log("Deleted footprint entry:", deletedFootprint._id);
    }

    const challengeResetResult =
      await DailyTrackingService.resetChallengesOnTrackingUpdate(userId);
    if (
      challengeResetResult.message &&
      challengeResetResult.message.includes("reset")
    ) {
      resetResults.challengesReset = true;
    }

    const Recommendation = require("../models/Recommendation");
    const deletedRecommendations = await Recommendation.deleteMany({
      userId: userId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    if (deletedRecommendations.deletedCount > 0) {
      resetResults.recommendationsCleared = true;
    }

    console.log("Daily reset completed:", resetResults);

    res.json({
      success: true,
      message: "Your daily carbon tracking has been reset successfully",
      data: {
        resetDate: today.toISOString().split("T")[0],
        ...resetResults,
        details: {
          footprintDeleted: !!deletedFootprint,
          challengeResetResult: challengeResetResult.message,
          recommendationsDeleted: deletedRecommendations.deletedCount,
        },
      },
    });
  } catch (error) {
    console.error("Error resetting daily data:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to reset your daily data. Please try again.",
      details: error.message,
    });
  }
});

router.get("/today", async (req, res) => {
  try {
    const userId = req.userId;

    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const footprint = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    }).select("calculatedFootprint rawAnswers createdAt updatedAt");

    if (!footprint) {
      return res.json({
        success: true,
        data: null,
        message: "No footprint entry for today",
      });
    }

    res.json({
      success: true,
      data: {
        id: footprint._id,
        footprintId: footprint._id,
        calculatedFootprint: footprint.calculatedFootprint,
        hasAiData: !!footprint.rawAnswers,
        submittedAt: footprint.createdAt,
        lastUpdated: footprint.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching today's footprint:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to retrieve today's footprint data",
    });
  }
});

module.exports = router;
