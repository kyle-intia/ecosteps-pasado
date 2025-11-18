// routes/userSettingsRoute.js
const express = require('express');
const router = express.Router();
const UserSettingsService = require('../services/userSettingsService');
const UserSettings = require('../models/userSettingsModel');
const User = require('../models/user.model');

router.get('/notification/:userId', async (req, res) => {
  try {
    const settings = await UserSettingsService.getSettingsByUserId(req.params.userId);
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user settings
router.put('/notification/:userId', async (req, res) => {
  try {
    const updatedSettings = await UserSettingsService.updateSettings(req.params.userId, req.body);
    res.json(updatedSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notification-enabled', async (req, res) => {
  try {
    const settings = await UserSettings.find({ emailNotification: true }).populate('userId', 'email name');
    // Map to a simple array of users
    const users = settings.map(s => ({
      email: s.userId.email,
      name: s.userId.name
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
