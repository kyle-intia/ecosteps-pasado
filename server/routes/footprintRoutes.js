// server/routes/footprintRoutes.js
// API endpoints for footprint operations with AI recommendation integration

const express = require('express');
const router = express.Router();
const DailyTracking = require('../models/DailyTracking');
const Challenge = require('../models/Challenge');
const DailyTrackingService = require('../services/dailyTrackingService');
const authenticate = require('../middleware/authenticate');
const EmissionFactorService = require('../services/emissionFactorService');
const LeaderboardService = require('../services/leaderboardService')
const NotificationService = require('../services/notificationService');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/footprint/submit
 * Submit carbon footprint data and prepare for AI recommendations
 * This endpoint extends the existing daily tracking functionality
 */
router.post('/submit', async (req, res) => {
  try {

    const co2Factors = await EmissionFactorService.getFormattedFactors();
    DailyTrackingService.init(co2Factors);

    const userId = req.userId;
    const trackingData = req.body;

    console.log('Footprint submission received for user:', userId);

    // Validate required fields using existing validation
    if (!trackingData.transport || !trackingData.homeEnergy || !trackingData.food) {
      return res.status(400).json({
        success: false,
        error: 'Missing required tracking data',
        message: 'Please fill out all sections: transport, home energy, and food'
      });
    }

    // Normalize food values to match model enum values
    const normalizeFoodValue = (value) => {
      const v = (value || '').replace('-', '_');
      if (v === 'none') return 'skipped';
      if (v === 'plant_based') return 'plant';
      return v;
    };

    const normalizedFood = {
      breakfast: normalizeFoodValue(trackingData.food.breakfast),
      lunch: normalizeFoodValue(trackingData.food.lunch),
      dinner: normalizeFoodValue(trackingData.food.dinner)
    };

    // Transform transport data to match DailyTracking model schema
    const transformTransportData = (transportData) => {
      const modes = Array.isArray(transportData.modes) ? transportData.modes : [];
      const distances = transportData.distances || {};

      // Transform modes array to match schema
      const transformedModes = modes.map(mode => {
        if (typeof mode === 'string') {
          return {
            id: mode,
            distance: distances[mode] || 0
          };
        } else if (typeof mode === 'object' && mode && mode.id) {
          return {
            id: mode.id,
            distance: mode.distance || distances[mode.id] || 0
          };
        }
        return null;
      }).filter(Boolean);

      return {
        modes: transformedModes,
        flightType: trackingData.flightsToday || 'none'
      };
    };

    // Transform home energy data to match schema
    const transformHomeEnergyData = (homeEnergyData) => {
      const appliances = Array.isArray(homeEnergyData.appliances) ? homeEnergyData.appliances : [];
      // Map frontend appliance values to backend enum values
      const normalizedAppliances = appliances.map(appliance => {
        if (appliance === 'aircon') return 'ac_heating';
        if (appliance === 'laundry') return 'laundry';
        if (appliance === 'none') return 'none';
        return appliance;
      });

      return {
        homeType: homeEnergyData.homeType,
        occupants: homeEnergyData.occupants,
        appliances: normalizedAppliances
      };
    };

    const transformedTransport = transformTransportData(trackingData.transport);
    const transformedHomeEnergy = transformHomeEnergyData(trackingData.homeEnergy);
    const email = req.email

    // Get today's date in Philippines timezone (matching existing logic)
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Check if entry already exists
    let existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const isUpdate = !!existingEntry;

    // Calculate footprint using existing service
    const calculatedFootprint = DailyTrackingService.calculateDailyFootprint({
      transport: trackingData.transport,
      flightType: trackingData.flightsToday || 'no_flight',
      homeType: trackingData.homeEnergy.homeType,
      occupants: trackingData.homeEnergy.occupants,
      appliances: trackingData.homeEnergy.appliances,
      breakfast: normalizedFood.breakfast,
      lunch: normalizedFood.lunch,
      dinner: normalizedFood.dinner
    });

    let savedEntry;

    if (existingEntry) {
      // Update existing entry
      existingEntry.transport = trackingData.transport;
      existingEntry.homeEnergy = trackingData.homeEnergy;
      existingEntry.food = trackingData.food;
      existingEntry.calculatedFootprint = calculatedFootprint;
      existingEntry.updatedAt = new Date();

      // Store detailed breakdown for AI recommendations in rawAnswers instead of aiRecommendationData
      existingEntry.rawAnswers = {
        transport: trackingData.transport,
        homeEnergy: trackingData.homeEnergy,
        food: trackingData.food,
        timestamp: new Date()
      };

      savedEntry = await existingEntry.save();

      // Reset challenges if this is an update (using existing service)
      await DailyTrackingService.resetChallengesOnTrackingUpdate(userId);

    } else {
      // Create new entry
      const newEntry = new DailyTracking({
        userId: userId,
        date: today,
        transport: trackingData.transport,
        homeEnergy: trackingData.homeEnergy,
        food: trackingData.food,
        calculatedFootprint,
        // Store additional data needed for AI recommendations in rawAnswers instead of aiRecommendationData
        rawAnswers: {
          transport: trackingData.transport,
          homeEnergy: trackingData.homeEnergy,
          food: trackingData.food,
          timestamp: new Date()
        }
      });

      await NotificationService.createNotification(userId, `${email}} logged his/her daily carbon footprint`, "daily-tracking");

      await LeaderboardService.addPoints(userId, 100, 'Completed a daily tracking');

      savedEntry = await newEntry.save();

    }

    console.log('Footprint saved successfully:', savedEntry._id);

    // Return the saved footprint data for AI recommendations
    res.json({
      success: true,
      data: {
        id: savedEntry._id,
        footprintId: savedEntry._id, // For AI recommendations endpoint
        isUpdate,
        calculatedFootprint,
        breakdown: {
          transport: calculatedFootprint.transport,
          homeEnergy: calculatedFootprint.homeEnergy,
          food: calculatedFootprint.food,
          total: calculatedFootprint.total
        },
        // Additional context for recommendations
        context: {
          transportModes: trackingData.transport.modes || [],
          homeType: trackingData.homeEnergy.homeType,
          occupants: trackingData.homeEnergy.occupants,
          appliances: trackingData.homeEnergy.appliances || [],
          meals: {
            breakfast: normalizedFood.breakfast,
            lunch: normalizedFood.lunch,
            dinner: normalizedFood.dinner
          }
        }
      }
    });

  } catch (error) {
    console.error('Error submitting footprint:', error);

    if (error.message.includes('Invalid responses')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tracking data',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to save your carbon footprint. Please try again.'
    });
  }
});

/**
 * POST /api/footprint/reset-daily
 * Reset today's carbon tracking and eco-challenges for the authenticated user
 */
router.post('/reset-daily', async (req, res) => {
  try {
    const userId = req.userId;

    console.log('Daily reset requested for user:', userId);

    // Get today's date in Philippines timezone
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Track what was reset for user feedback
    const resetResults = {
      footprintReset: false,
      challengesReset: false,
      recommendationsCleared: false
    };

    // 1. Delete today's footprint entry
    const deletedFootprint = await DailyTracking.findOneAndDelete({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (deletedFootprint) {
      resetResults.footprintReset = true;
      console.log('Deleted footprint entry:', deletedFootprint._id);
    }

    // 2. Reset today's challenges using existing service
    const challengeResetResult = await DailyTrackingService.resetChallengesOnTrackingUpdate(userId);
    if (challengeResetResult.message && challengeResetResult.message.includes('reset')) {
      resetResults.challengesReset = true;
    }

    // 3. Clear any cached recommendations (if you implement recommendation caching)
    // This could be extended to delete from a Recommendation model if implemented
    const Recommendation = require('../models/Recommendation');
    const deletedRecommendations = await Recommendation.deleteMany({
      userId: userId,
      createdAt: { $gte: today, $lt: tomorrow }
    });

    if (deletedRecommendations.deletedCount > 0) {
      resetResults.recommendationsCleared = true;
    }

    console.log('Daily reset completed:', resetResults);

    res.json({
      success: true,
      message: 'Your daily carbon tracking has been reset successfully',
      data: {
        resetDate: today.toISOString().split('T')[0],
        ...resetResults,
        details: {
          footprintDeleted: !!deletedFootprint,
          challengeResetResult: challengeResetResult.message,
          recommendationsDeleted: deletedRecommendations.deletedCount
        }
      }
    });

  } catch (error) {
    console.error('Error resetting daily data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to reset your daily data. Please try again.',
      details: error.message
    });
  }
});

/**
 * GET /api/footprint/today
 * Get today's footprint data for the authenticated user
 * This complements the existing daily tracking endpoints
 */
router.get('/today', async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date in Philippines timezone
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const footprint = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    }).select('calculatedFootprint rawAnswers createdAt updatedAt');

    if (!footprint) {
      return res.json({
        success: true,
        data: null,
        message: 'No footprint entry for today'
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
        lastUpdated: footprint.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s footprint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve today\'s footprint data'
    });
  }
});

module.exports = router;