// server/routes/dailyTrackingRoutes.js
const express = require('express');
const router = express.Router();
const DailyTrackingService = require('../services/dailyTrackingService');
const DailyTracking = require('../models/DailyTracking');
const authenticate = require('../middleware/authenticate');
const NotificationService = require('../services/notificationService');
const EmissionFactorService = require('../services/emissionFactorService');
const LeaderboardService = require('../services/leaderboardService');
const CertificateRewardService = require('../services/certificateRewardService');
const AchievementService = require('../services/achievementService');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/daily-tracking/today
 * Get today's tracking entry for the authenticated user
 */
router.get('/today', async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date in Philippines timezone
    const now = new Date();

    // Get the current date/time in the Philippines (UTC+8)
    const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    // Create a 'today' date at midnight in the Philippines (UTC+8)
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));

    // 'Tomorrow' is 24 hours after 'today'
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const entry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!entry) {
      return res.json({
        success: true,
        data: null,
        message: 'No tracking entry for today'
      });
    }

    res.json({
      success: true,
      data: entry
    });

  } catch (error) {
    console.error('Error fetching today\'s tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/daily-tracking
 * Get daily tracking history for the authenticated user
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 30, offset = 0 } = req.query;

    const limitNum = Math.min(Math.max(parseInt(limit), 1), 100);
    const offsetNum = Math.max(parseInt(offset), 0);

    // Calculate the start and end of the current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Fetch entries for the current month
    const entries = await DailyTracking.find({
      userId,
      date: { $gte: startOfMonth, $lt: startOfNextMonth }
    })
      .sort({ date: -1 })
      .limit(limitNum)
      .skip(offsetNum)
      .select('date calculatedFootprint transport homeEnergy food createdAt')
      .lean();

    const total = await DailyTracking.countDocuments({
      userId,
      date: { $gte: startOfMonth, $lt: startOfNextMonth }
    });

    res.json({
      success: true,
      data: {
        entries: entries.map(entry => ({
          id: entry._id,
          date: entry.date.toISOString().split('T')[0],
          footprint: entry.calculatedFootprint,
          transport: entry.transport,
          homeEnergy: entry.homeEnergy,
          food: entry.food,
          createdAt: entry.createdAt
        })),
        total,
        limit: limitNum,
        offset: offsetNum,
        hasNext: offsetNum + limitNum < total
      }
    });

  } catch (error) {
    console.error('Error fetching current month tracking history:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/daily-tracking/submit
 * Submit or update daily tracking data
 */
router.post('/submit', async (req, res) => {
  try {

    const co2Factors = await EmissionFactorService.getFormattedFactors();
    DailyTrackingService.init(co2Factors);

    const userId = req.userId;
    const trackingData = req.body;

    // Validate required fields
    if (!trackingData.transport || !trackingData.homeEnergy || !trackingData.food) {
      return res.status(400).json({
        success: false,
        error: 'Missing required tracking data'
      });
    }

    // Get today's date in Philippines timezone
    const now = new Date();

    // Get the current date/time in the Philippines (UTC+8)
    const phNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    // Create a 'today' date at midnight in the Philippines (UTC+8)
    const today = new Date(phNow.getFullYear(), phNow.getMonth(), phNow.getDate());

    // 'Tomorrow' is 24 hours after 'today'
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Check if entry already exists
    let existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const isUpdate = !!existingEntry;

    // Calculate footprint using the service
    const calculatedFootprint = DailyTrackingService.calculateDailyFootprint({
      transport: trackingData.transport,
      flightType: trackingData.flightsToday || 'no_flight',
      homeType: trackingData.homeEnergy.homeType,
      occupants: trackingData.homeEnergy.occupants,
      appliances: trackingData.homeEnergy.appliances,
      breakfast: trackingData.food.breakfast,
      lunch: trackingData.food.lunch,
      dinner: trackingData.food.dinner
    });

    if (existingEntry) {
      // Update existing entry
      existingEntry.transport = trackingData.transport;
      existingEntry.homeEnergy = trackingData.homeEnergy;
      existingEntry.food = trackingData.food;
      existingEntry.calculatedFootprint = calculatedFootprint;
      existingEntry.updatedAt = new Date();

      await existingEntry.save();

      // Reset challenges if this is an update
      const resetResult = await DailyTrackingService.resetChallengesOnTrackingUpdate(userId);

      // Check for achievements
      const newAchievements = await DailyTrackingService.handleTrackingAchievements(userId, calculatedFootprint, trackingData);


      res.json({
        success: true,
        data: {
          id: existingEntry._id,
          isUpdate: true,
          calculatedFootprint,
          newAchievements,
          resetResult
        }
      });
    } else {
      
      // Create new entry
      const newEntry = new DailyTracking({
        userId: userId,
        date: today,
        transport: trackingData.transport,
        homeEnergy: trackingData.homeEnergy,
        food: trackingData.food,
        calculatedFootprint
      });

      await newEntry.save();

      // Check for achievements
      const newAchievements = await DailyTrackingService.handleTrackingAchievements(userId, calculatedFootprint, trackingData);

      await LeaderboardService.addPoints(userId, 100, 'Completed a daily tracking');

      await CertificateRewardService.checkCertificatesForUser(userId);
      await CertificateRewardService.checkRewardsForUser(userId);
      await AchievementService.checkAchievements(userId, 'daily_tracking_completed');

      res.json({
        success: true,
        data: {
          id: newEntry._id,
          isUpdate: false,
          calculatedFootprint,
          newAchievements
        }
      });
    }

  } catch (error) {
    console.error('Error submitting tracking:', error);

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
      message: error.message
    });
  }
});

/**
 * POST /api/daily-tracking/check-resubmission
 * Check if user has existing tracking entry for today
 */
router.post('/check-resubmission', async (req, res) => {
  try {
    const userId = req.userId;

    // Get today's date in Philippines timezone
    const now = new Date();

    // Get the current date/time in the Philippines (UTC+8)
    const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    // Create a 'today' date at midnight in the Philippines (UTC+8)
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));

    // 'Tomorrow' is 24 hours after 'today'
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!existingEntry) {
      return res.json({
        success: true,
        data: {
          isResubmission: false,
          hasExistingEntry: false
        }
      });
    }

    // Check completed challenges
    const Challenge = require('../models/Challenge');
    const challengeDoc = await Challenge.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    const completedChallenges = challengeDoc ?
      challengeDoc.dailyChallenges.filter(c => c.completed) : [];

    res.json({
      success: true,
      data: {
        isResubmission: true,
        hasExistingEntry: true,
        existingFootprint: existingEntry.calculatedFootprint,
        completedChallengesCount: completedChallenges.length,
        completedChallenges: completedChallenges.map(c => ({
          id: c.id,
          title: c.title,
          category: c.category
        })),
        warning: {
          title: "Update Daily Tracking",
          message: "You already have a tracking entry for today. Updating it will recalculate your footprint.",
          challengesWillReset: completedChallenges.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Error checking resubmission:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/daily-tracking/stats
 * Get daily tracking statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const entries = await DailyTracking.find({
      userId: userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    const totalEntries = entries.length;
    const avgFootprint = totalEntries > 0 ?
      entries.reduce((sum, entry) => sum + (entry.calculatedFootprint?.total || 0), 0) / totalEntries : 0;

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalEntries,
        averageFootprint: Math.round(avgFootprint * 100) / 100,
        entries: entries.map(entry => ({
          date: entry.date.toISOString().split('T')[0],
          footprint: entry.calculatedFootprint?.total || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching tracking stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * DELETE /api/daily-tracking/:entryId
 * Delete a specific tracking entry
 */
router.delete('/:entryId', async (req, res) => {
  try {
    const userId = req.userId;
    const { entryId } = req.params;

    const entry = await DailyTracking.findOneAndDelete({
      _id: entryId,
      userId: userId
    });

    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'Tracking entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Tracking entry deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting tracking entry:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;