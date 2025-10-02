// server/routes/achievementRoutes.js - Add to server/routes/
const express = require('express');
const router = express.Router();
const AchievementService = require('../services/achievementService');
const authenticate = require('../middleware/authenticate');

router.use(authenticate);

// Get all achievements for user with unlock status
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const data = await AchievementService.getUserAchievements(userId);

    res.json(data);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Equip achievement
router.post('/equip', async (req, res) => {
  try {
    const userId = req.userId;
    const { achievementId } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({
        success: false,
        error: 'Achievement ID is required'
      });
    }
    
    const equipped = await AchievementService.equipAchievement(userId, achievementId);
    
    res.json({
      success: true,
      data: { equipped }
    });
  } catch (error) {
    console.error('Error equipping achievement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Unequip achievement
router.post('/unequip', async (req, res) => {
  try {
    const userId = req.userId;
    const { achievementId } = req.body;
    
    if (!achievementId) {
      return res.status(400).json({
        success: false,
        error: 'Achievement ID is required'
      });
    }
    
    const equipped = await AchievementService.unequipAchievement(userId, achievementId);
    
    res.json({
      success: true,
      data: { equipped }
    });
  } catch (error) {
    console.error('Error unequipping achievement:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Get notifications for user
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.userId;
    const { limit = 20, unreadOnly = false } = req.query;
    
    const Notification = require('../models/Notification');
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    
    const Notification = require('../models/Notification');
    
    await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true }
    );
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;