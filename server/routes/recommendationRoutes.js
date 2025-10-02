// server/routes/recommendationRoutes.js
// AI-powered recommendation endpoints using Hugging Face API

const express = require('express');
const router = express.Router();
const DailyTracking = require('../models/DailyTracking');
const Recommendation = require('../models/Recommendation');
const AIRecommendationService = require('../services/aiRecommendationService');
const authenticate = require('../middleware/authenticate');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/recommendations
 * Generate AI-powered carbon footprint recommendations based on user's daily tracking data
 */
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { footprintId } = req.body;

    console.log('AI recommendation request for user:', userId, 'footprint:', footprintId);

    // Validate request
    if (!footprintId) {
      return res.status(400).json({
        success: false,
        error: 'Missing footprint ID',
        message: 'Please provide a valid footprint ID to generate recommendations'
      });
    }

    // Fetch the footprint data and verify user ownership
    const footprint = await DailyTracking.findOne({
      _id: footprintId,
      userId: userId // Ensure user can only access their own data
    });

    if (!footprint) {
      return res.status(404).json({
        success: false,
        error: 'Footprint not found',
        message: 'The requested footprint data could not be found or you do not have access to it'
      });
    }

    // Check if we already have recent recommendations for this footprint
    const existingRecommendations = await Recommendation.findOne({
      userId: userId,
      footprintId: footprintId,
      // Only use recommendations created within the last hour to allow for fresh insights
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
    });

    if (existingRecommendations) {
      console.log('Using cached recommendations for footprint:', footprintId);
      return res.json({
        success: true,
        data: {
          recommendations: existingRecommendations.recommendations,
          footprintSummary: existingRecommendations.footprintSummary,
          cached: true,
          generatedAt: existingRecommendations.createdAt
        }
      });
    }

    // Prepare data for AI analysis
    const footprintData = {
      breakdown: footprint.calculatedFootprint,
      transportModes: footprint.rawAnswers?.transport?.modes || [],
      homeType: footprint.rawAnswers?.homeEnergy?.homeType || footprint.homeEnergy.homeType,
      occupants: footprint.rawAnswers?.homeEnergy?.occupants || footprint.homeEnergy.occupants,
      appliances: footprint.rawAnswers?.homeEnergy?.appliances || footprint.homeEnergy.appliances,
      meals: footprint.rawAnswers?.food || {
        breakfast: footprint.food.breakfast,
        lunch: footprint.food.lunch,
        dinner: footprint.food.dinner
      }
    };

    console.log('Generating AI recommendations with data:', {
      totalEmissions: footprintData.breakdown.total,
      categories: Object.keys(footprintData.breakdown)
    });

    // Generate AI recommendations using the service
    const aiResponse = await AIRecommendationService.generateRecommendations(footprintData);

    // Save recommendations to database for caching and analytics
    const recommendationDoc = new Recommendation({
      userId: userId,
      footprintId: footprintId,
      footprintSummary: {
        total: footprintData.breakdown.total,
        transport: footprintData.breakdown.transport,
        homeEnergy: footprintData.breakdown.homeEnergy,
        food: footprintData.breakdown.food,
        date: footprint.date
      },
      recommendations: aiResponse.recommendations,
      aiMetadata: {
        model: aiResponse.model,
        processingTime: aiResponse.processingTime,
        prompt: aiResponse.prompt,
        rawResponse: aiResponse.rawResponse
      }
    });

    await recommendationDoc.save();

    console.log('AI recommendations generated and saved:', recommendationDoc._id);

    res.json({
      success: true,
      data: {
        recommendations: aiResponse.recommendations,
        footprintSummary: recommendationDoc.footprintSummary,
        cached: false,
        generatedAt: recommendationDoc.createdAt,
        processingTime: aiResponse.processingTime
      }
    });

  } catch (error) {
    console.error('Error generating AI recommendations:', error);

    // Handle specific API errors
    if (error.message.includes('Hugging Face API')) {
      return res.status(503).json({
        success: false,
        error: 'AI service temporarily unavailable',
        message: 'The AI recommendation service is currently unavailable. Please try again later.',
        details: error.message
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please wait a moment before trying again.',
        retryAfter: 60
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to generate recommendations. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/recommendations/history
 * Get historical recommendations for the authenticated user
 */
router.get('/history', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 10, offset = 0 } = req.query;

    const recommendations = await Recommendation.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('footprintSummary recommendations createdAt');

    const total = await Recommendation.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        recommendations: recommendations.map(rec => ({
          id: rec._id,
          footprintSummary: rec.footprintSummary,
          recommendations: rec.recommendations,
          generatedAt: rec.createdAt
        })),
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: total > parseInt(offset) + parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching recommendation history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve recommendation history'
    });
  }
});

/**
 * POST /api/recommendations/retry
 * Retry AI recommendation generation for a specific footprint
 */
router.post('/retry', async (req, res) => {
  try {
    const userId = req.userId;
    const { footprintId } = req.body;

    console.log('Retrying AI recommendations for user:', userId, 'footprint:', footprintId);

    if (!footprintId) {
      return res.status(400).json({
        success: false,
        error: 'Missing footprint ID',
        message: 'Please provide a valid footprint ID'
      });
    }

    // Delete existing recommendations to force regeneration
    await Recommendation.deleteMany({
      userId: userId,
      footprintId: footprintId
    });

    // Forward to the main recommendations endpoint
    req.body = { footprintId };
    return router.handle(req, res);

  } catch (error) {
    console.error('Error retrying recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retry recommendations'
    });
  }
});

/**
 * GET /api/recommendations/status
 * Check if recommendations are available for today's footprint
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Check for today's footprint
    const todaysFootprint = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!todaysFootprint) {
      return res.json({
        success: true,
        data: {
          hasFootprint: false,
          hasRecommendations: false,
          message: 'No footprint data found for today'
        }
      });
    }

    // Check for existing recommendations
    const recommendations = await Recommendation.findOne({
      userId: userId,
      footprintId: todaysFootprint._id
    });

    res.json({
      success: true,
      data: {
        hasFootprint: true,
        hasRecommendations: !!recommendations,
        footprintId: todaysFootprint._id,
        totalEmissions: todaysFootprint.calculatedFootprint.total,
        recommendationsGeneratedAt: recommendations?.createdAt || null
      }
    });

  } catch (error) {
    console.error('Error checking recommendation status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to check recommendation status'
    });
  }
});

module.exports = router;