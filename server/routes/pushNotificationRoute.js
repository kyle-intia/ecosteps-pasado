// routes/pushNotificationRoute.js
const express = require('express');
const router = express.Router();
const UserSettings = require('../models/userSettingsModel');
const { sendPushNotification } = require('../services/webPushService');

// Save subscription
router.post('/subscribe', async (req, res) => {
  const { userId, subscription } = req.body;

  if (!userId || !subscription) {
    return res.status(400).json({ error: 'Missing userId or subscription.' });
  }

  try {
    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      { pushSubscription: subscription },
      { new: true }
    );

    if (!settings) {
      return res.status(404).json({ error: 'User settings not found.' });
    }

    res.status(200).json({ message: 'Subscription saved.' });
  } catch (err) {
    console.error('Save subscription error:', err);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

// Send notification to one user (if pushNotification is enabled)
router.post('/send', async (req, res) => {
  const { userId, title, body, url } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Missing fields.' });
  }

  try {
    const settings = await UserSettings.findOne({ userId });

    if (!settings || !settings.pushNotification || !settings.pushSubscription) {
      return res.status(400).json({ error: 'Push notifications are disabled or missing.' });
    }

    const result = await sendPushNotification(settings.pushSubscription, { title, body, url });

    if (result.success) {
      res.json({ message: 'Notification sent.' });
    } else {
      res.status(500).json({ error: result.error || 'Push failed' });
    }
  } catch (err) {
    console.error('Send push error:', err);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
