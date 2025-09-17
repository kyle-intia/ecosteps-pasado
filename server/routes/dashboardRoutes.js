// server/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const DashboardService = require('../services/dashboardService');

// Get comprehensive dashboard summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.userId; // from authenticate middleware
    const dashboardData = await DashboardService.getDashboardSummary(userId);
    
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch dashboard data'
    });
  }
});

// Get monthly trend data
router.get('/trends', async (req, res) => {
  try {
    const userId = req.userId;
    const { months = 6 } = req.query;
    
    const trendsData = await DashboardService.getMonthlyTrends(userId, parseInt(months));
    
    res.status(200).json({
      success: true,
      data: trendsData
    });
  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch trends data'
    });
  }
});

module.exports = router;