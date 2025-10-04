// routes/userSettingsRoute.js
const express = require('express');
const router = express.Router();
const UserSettingsService = require('../services/userSettingsService');

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

module.exports = router;
