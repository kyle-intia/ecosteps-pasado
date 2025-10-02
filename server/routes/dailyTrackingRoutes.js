// API routes for daily carbon footprint tracking
// Handles CRUD operations for daily tracking entries

const express = require('express');
const router = express.Router();
const DailyTracking = require('../models/DailyTracking');
const DailyTrackingService = require('../services/dailyTrackingService');
const authenticate = require('../middleware/authenticate');
const NotificationService = require('../services/notificationService');
const EmissionFactorService = require('../services/emissionFactorService');


// All routes below require an authenticated user; user id comes from req.userId
router.use(authenticate);

/**
 * POST /api/daily-tracking/submit
 * Submit daily carbon footprint tracking data
 */
router.post('/submit', async (req, res) => {
  try {
    // 🔁 Fetch latest CO2 factors from DB
    const co2Factors = await EmissionFactorService.getFormattedFactors();
    DailyTrackingService.init(co2Factors);

    const { transport, homeEnergy, food, flightsToday } = req.body;
    const userId = req.userId;
    const email = req.user.email;

    const normalizedOccupants = Math.max(1, Math.min(20, Number(homeEnergy?.occupants) || 1));
    const responses = {
      transport: transport || { modes: [], distances: {} },
      flightType: flightsToday || transport?.flightType || 'no_flight',
      homeType: homeEnergy?.homeType,
      occupants: normalizedOccupants,
      appliances: homeEnergy?.appliances || [],
      breakfast: food?.breakfast || 'skipped',
      lunch: food?.lunch || 'skipped',
      dinner: food?.dinner || 'skipped'
    };

    const calculatedFootprint = DailyTrackingService.calculateDailyFootprint(responses);

    await NotificationService.createNotification(userId, `${email} logged his/her daily carbon footprint`, "daily-tracking");

    const normalizeHomeType = (t) => (t || '').replace('-', '_');
    const normalizeAppliance = (a) => {
      const key = (a || '').replace('-', '_');
      return key === 'aircon' ? 'ac_heating' : key;
    };
    const normalizeMeal = (m) => {
      const key = (m || '').replace('-', '_');
      if (key === 'none') return 'skipped';
      if (key === 'plant_based') return 'plant';
      return key;
    };

    const normalizedHomeEnergy = homeEnergy ? {
      homeType: normalizeHomeType(homeEnergy.homeType),
      occupants: normalizedOccupants,
      appliances: Array.isArray(homeEnergy.appliances) ? homeEnergy.appliances.map(normalizeAppliance) : []
    } : undefined;

    const normalizedFood = food ? {
      breakfast: normalizeMeal(food.breakfast || 'skipped'),
      lunch: normalizeMeal(food.lunch || 'skipped'),
      dinner: normalizeMeal(food.dinner || 'skipped')
    } : undefined;

    const now = new Date();
    const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    let dailyTracking;

    if (existingEntry) {
      existingEntry.transport = transport;
      existingEntry.homeEnergy = normalizedHomeEnergy;
      existingEntry.food = normalizedFood;
      existingEntry.calculatedFootprint = calculatedFootprint;
      dailyTracking = await existingEntry.save();
    } else {
      dailyTracking = new DailyTracking({
        userId,
        date: today,
        transport,
        homeEnergy: normalizedHomeEnergy,
        food: normalizedFood,
        calculatedFootprint
      });
      await dailyTracking.save();
    }

    res.status(201).json({
      success: true,
      data: {
        id: dailyTracking._id,
        date: dailyTracking.dateString,
        calculatedFootprint: dailyTracking.calculatedFootprint,
        createdAt: dailyTracking.createdAt,
        isUpdate: !!existingEntry
      }
    });

  } catch (error) {
    console.error('Error in daily tracking submission:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({
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

    const dailyEntries = await DailyTracking.find({ userId })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('date calculatedFootprint createdAt');

    res.json({
      success: true,
      data: {
        count: dailyEntries.length,
        entries: dailyEntries.map(entry => ({
          id: entry._id,
          date: entry.dateString,
          footprint: entry.calculatedFootprint,
          createdAt: entry.createdAt,
          isToday: entry.isToday()
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching daily tracking history:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

/**
 * GET /api/daily-tracking/today
 * Get today's tracking entry for the authenticated user
 */
router.get('/today', async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get today's date range in Philippines timezone
    // Get current UTC time
    const now = new Date();

    // Get the current date/time in the Philippines (UTC+8)
    const phNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));

    // Create a 'today' date at midnight in the Philippines (UTC+8)
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));

    // 'Tomorrow' is 24 hours after 'today'
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);


    const todayEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!todayEntry) {
      // Return 200 with null data to indicate no entry for today (avoid 404 noise on client)
      return res.status(200).json({
        success: true,
        data: null,
        hasEntry: false
      });
    }

    res.json({
      success: true,
      data: {
        id: todayEntry._id,
        date: todayEntry.dateString,
        transport: todayEntry.transport,
        homeEnergy: todayEntry.homeEnergy,
        food: todayEntry.food,
        calculatedFootprint: todayEntry.calculatedFootprint,
        createdAt: todayEntry.createdAt,
        hasEntry: true
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s entry:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

/**
 * GET /api/daily-tracking/stats
 * Get summary statistics for the authenticated user's tracking data
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.userId;
    const { days = 7 } = req.query; // Default to last 7 days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    startDate.setHours(0, 0, 0, 0);

    const entries = await DailyTracking.find({
      userId: userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    if (entries.length === 0) {
      return res.json({
        success: true,
        data: {
          period: `${days} days`,
          totalEntries: 0,
          averageDaily: { transport: 0, homeEnergy: 0, food: 0, total: 0 },
          totalPeriod: { transport: 0, homeEnergy: 0, food: 0, total: 0 }
        }
      });
    }

    // Calculate totals and averages
    const totals = entries.reduce((acc, entry) => {
      acc.transport += entry.calculatedFootprint.transport;
      acc.homeEnergy += entry.calculatedFootprint.homeEnergy;
      acc.food += entry.calculatedFootprint.food;
      acc.total += entry.calculatedFootprint.total;
      return acc;
    }, { transport: 0, homeEnergy: 0, food: 0, total: 0 });

    const averages = {
      transport: Math.round((totals.transport / entries.length) * 100) / 100,
      homeEnergy: Math.round((totals.homeEnergy / entries.length) * 100) / 100,
      food: Math.round((totals.food / entries.length) * 100) / 100,
      total: Math.round((totals.total / entries.length) * 100) / 100
    };

    res.json({
      success: true,
      data: {
        period: `${days} days`,
        totalEntries: entries.length,
        averageDaily: averages,
        totalPeriod: {
          transport: Math.round(totals.transport * 100) / 100,
          homeEnergy: Math.round(totals.homeEnergy * 100) / 100,
          food: Math.round(totals.food * 100) / 100,
          total: Math.round(totals.total * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Error fetching tracking stats:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

/**
 * DELETE /api/daily-tracking/:entryId
 * Delete a specific tracking entry for the authenticated user
 */
router.delete('/:entryId', async (req, res) => {
  try {
    const userId = req.userId;
    const { entryId } = req.params;

    const deletedEntry = await DailyTracking.findOneAndDelete({
      _id: entryId,
      userId: userId
    });

    if (!deletedEntry) {
      return res.status(404).json({ 
        error: 'Tracking entry not found or does not belong to user' 
      });
    }

    res.json({
      success: true,
      message: 'Tracking entry deleted successfully',
      data: {
        deletedDate: deletedEntry.dateString,
        deletedFootprint: deletedEntry.calculatedFootprint.total
      }
    });

  } catch (error) {
    console.error('Error deleting tracking entry:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

module.exports = router;