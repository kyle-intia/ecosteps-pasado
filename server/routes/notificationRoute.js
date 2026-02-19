const express = require("express");
const NotificationService = require("../services/notificationService");
const router = express.Router();

router.get("/push_notification", async (req, res) => {
  try {
    const pushNotificationMode =
      await NotificationService.getPushNotificationMode();
    res.json({ pushNotificationMode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/push_notification", async (req, res) => {
  try {
    const { pushNotificationMode } = req.body;
    const updatedStatus =
      await NotificationService.setPushNotificationMode(pushNotificationMode);
    res.json({ success: true, pushNotificationMode: updatedStatus });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post("/send-notification", async (req, res) => {
  const { userId, message } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ error: "User ID and message are required" });
  }

  try {
    const newNotification = await NotificationService.createNotification(
      userId,
      message,
    );
    return res
      .status(201)
      .json({ success: true, notification: newNotification });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/admin/all", async (req, res) => {
  const factors = await NotificationService.getAllNotification();
  res.json(factors);
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications =
      await NotificationService.getUserNotifications(userId);
    return res.status(200).json({ notifications });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put("/:id/read", async (req, res) => {
  const { id } = req.params;

  try {
    const notification = await NotificationService.markAsRead(id);
    return res.status(200).json({ success: true, notification });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
