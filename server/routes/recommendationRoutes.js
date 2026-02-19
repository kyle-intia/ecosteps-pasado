const express = require("express");
const router = express.Router();
const DailyTracking = require("../models/DailyTracking");
const Recommendation = require("../models/Recommendation");
const AIRecommendationService = require("../services/aiRecommendationService");
const authenticate = require("../middleware/authenticate");

router.use(authenticate);

router.post("/", async (req, res) => {
  try {
    const userId = req.userId;
    const { footprintId } = req.body;

    console.log(
      "AI recommendation request for user:",
      userId,
      "footprint:",
      footprintId,
    );

    if (!footprintId) {
      return res.status(400).json({
        success: false,
        error: "Missing footprint ID",
        message:
          "Please provide a valid footprint ID to generate recommendations",
      });
    }

    const footprint = await DailyTracking.findOne({
      _id: footprintId,
      userId: userId,
    });

    if (!footprint) {
      return res.status(404).json({
        success: false,
        error: "Footprint not found",
        message:
          "The requested footprint data could not be found or you do not have access to it",
      });
    }

    const existingRecommendations = await Recommendation.findOne({
      userId: userId,
      footprintId: footprintId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
    });

    if (existingRecommendations) {
      console.log("Using cached recommendations for footprint:", footprintId);
      return res.json({
        success: true,
        data: {
          recommendations: existingRecommendations.recommendations,
          footprintSummary: existingRecommendations.footprintSummary,
          cached: true,
          generatedAt: existingRecommendations.createdAt,
        },
      });
    }

    const footprintData = {
      breakdown: footprint.calculatedFootprint,
      transportModes: footprint.rawAnswers?.transport?.modes || [],
      homeType:
        footprint.rawAnswers?.homeEnergy?.homeType ||
        footprint.homeEnergy.homeType,
      occupants:
        footprint.rawAnswers?.homeEnergy?.occupants ||
        footprint.homeEnergy.occupants,
      appliances:
        footprint.rawAnswers?.homeEnergy?.appliances ||
        footprint.homeEnergy.appliances,
      meals: footprint.rawAnswers?.food || {
        breakfast: footprint.food.breakfast,
        lunch: footprint.food.lunch,
        dinner: footprint.food.dinner,
      },
    };

    console.log("Generating AI recommendations with data:", {
      totalEmissions: footprintData.breakdown.total,
      categories: Object.keys(footprintData.breakdown),
    });

    const aiResponse =
      await AIRecommendationService.generateRecommendations(footprintData);

    const recommendationDoc = new Recommendation({
      userId: userId,
      footprintId: footprintId,
      footprintSummary: {
        total: footprintData.breakdown.total,
        transport: footprintData.breakdown.transport,
        homeEnergy: footprintData.breakdown.homeEnergy,
        food: footprintData.breakdown.food,
        date: footprint.date,
      },
      recommendations: aiResponse.recommendations,
      aiMetadata: {
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        prompt: aiResponse.prompt,
        rawResponse: aiResponse.rawResponse,
      },
    });

    await recommendationDoc.save();

    console.log(
      "AI recommendations generated and saved:",
      recommendationDoc._id,
    );

    res.json({
      success: true,
      data: {
        recommendations: aiResponse.recommendations,
        footprintSummary: recommendationDoc.footprintSummary,
        cached: false,
        generatedAt: recommendationDoc.createdAt,
        processingTime: aiResponse.processingTime,
      },
    });
  } catch (error) {
    console.error("Error generating AI recommendations:", error);

    if (error.message.includes("Hugging Face API")) {
      return res.status(503).json({
        success: false,
        error: "AI service temporarily unavailable",
        message:
          "The AI recommendation service is currently unavailable. Please try again later.",
        details: error.message,
      });
    }

    if (error.message.includes("rate limit")) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded",
        message: "Too many requests. Please wait a moment before trying again.",
        retryAfter: 60,
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to generate recommendations. Please try again later.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0 } = req.query;

    const recommendations = await Recommendation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select("footprintSummary recommendations createdAt");

    const total = await Recommendation.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        recommendations: recommendations.map((rec) => ({
          id: rec._id,
          footprintSummary: rec.footprintSummary,
          recommendations: rec.recommendations,
          generatedAt: rec.createdAt,
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching recommendation history:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to retrieve recommendation history",
    });
  }
});

router.post("/retry", async (req, res) => {
  try {
    const userId = req.userId;
    const { footprintId } = req.body;

    console.log(
      "Retrying AI recommendations for user:",
      userId,
      "footprint:",
      footprintId,
    );

    if (!footprintId) {
      return res.status(400).json({
        success: false,
        error: "Missing footprint ID",
        message: "Please provide a valid footprint ID",
      });
    }

    await Recommendation.deleteMany({
      userId: userId,
      footprintId: footprintId,
    });

    req.body = { footprintId };
    return router.handle(req, res);
  } catch (error) {
    console.error("Error retrying recommendations:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to retry recommendations",
    });
  }
});

router.get("/status", async (req, res) => {
  try {
    const userId = req.userId;

    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(
      Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()),
    );
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todaysFootprint = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!todaysFootprint) {
      return res.json({
        success: true,
        data: {
          hasFootprint: false,
          hasRecommendations: false,
          message: "No footprint data found for today",
        },
      });
    }

    const recommendations = await Recommendation.findOne({
      userId: userId,
      footprintId: todaysFootprint._id,
    });

    res.json({
      success: true,
      data: {
        hasFootprint: true,
        hasRecommendations: !!recommendations,
        footprintId: todaysFootprint._id,
        totalEmissions: todaysFootprint.calculatedFootprint.total,
        recommendationsGeneratedAt: recommendations?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Error checking recommendation status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "Failed to check recommendation status",
    });
  }
});

module.exports = router;
