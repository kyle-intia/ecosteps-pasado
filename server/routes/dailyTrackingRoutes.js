// File: server/routes/dailyTrackingRoutes.js
// API routes for daily carbon footprint tracking
// Handles CRUD operations for daily tracking entries

const express = require('express');
const router = express.Router();
const DailyTracking = require('../models/DailyTracking');
const DailyTrackingService = require('../services/dailyTrackingService');

/**
 * POST /api/daily-tracking/submit
 * Submit daily carbon footprint tracking data
 */
router.post('/submit', async (req, res) => {
  try {
    const { userId, transport, homeEnergy, food, flightsToday } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Prepare responses object for calculation service
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

    // Calculate footprint using the service
    const calculatedFootprint = DailyTrackingService.calculateDailyFootprint(responses);

    // Normalize payload fields to match schema enums before saving
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

    // Get today's date (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if entry already exists for today
    const existingEntry = await DailyTracking.findOne({
      userId: userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    let dailyTracking;

    if (existingEntry) {
      // Update existing entry
      existingEntry.transport = transport;
      existingEntry.homeEnergy = normalizedHomeEnergy;
      existingEntry.food = normalizedFood;
      existingEntry.calculatedFootprint = calculatedFootprint;
      dailyTracking = await existingEntry.save();
    } else {
      // Create new entry
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
 * GET /api/daily-tracking/:userId
 * Get daily tracking history for a user
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
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
 * GET /api/daily-tracking/:userId/today
 * Get today's tracking entry for a user
 */
router.get('/:userId/today', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    const todayEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    if (!todayEntry) {
      return res.status(404).json({ 
        error: 'No tracking entry found for today',
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
 * GET /api/daily-tracking/:userId/stats
 * Get summary statistics for a user's tracking data
 */
router.get('/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
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
 * DELETE /api/daily-tracking/:userId/:entryId
 * Delete a specific tracking entry
 */
router.delete('/:userId/:entryId', async (req, res) => {
  try {
    const { userId, entryId } = req.params;

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