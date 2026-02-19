const DailyTracking = require("../models/DailyTracking");
const UserModel = require("../models/user.model");
const Notification = require("../models/notificationModel");
const NotificationService = require("../services/notificationService");
const UserSettings = require("../models/userSettingsModel");

const getUTCDateOnly = (date = new Date()) => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const reminderMessage = "You haven’t completed your daily tracking today.";
const notificationType = "daily-tracking-reminder";

const sendDailyTrackingReminders = async () => {
  try {
    const todayDateOnly = getUTCDateOnly();

    const users = await UserModel.find({}, "_id");

    await Promise.allSettled(
      users.map(async (user) => {
        try {
          const settings = await UserSettings.findOne({ userId: user._id });

          if (!settings || !settings.carbonReminder) {
            console.log(
              `Skipping notification for user ${user._id} because carbonReminder is not true`,
            );
            return;
          }

          const existingTracking = await DailyTracking.findOne({
            userId: user._id,
            date: todayDateOnly,
          });

          if (existingTracking) return;

          const existingNotification = await Notification.findOne({
            userId: user._id,
            type: notificationType,
            dateOnly: todayDateOnly.toISOString().slice(0, 10),
          });

          if (existingNotification) return;

          await NotificationService.createNotification(
            user._id,
            reminderMessage,
            notificationType,
            {
              dateOnly: todayDateOnly.toISOString().slice(0, 10),
              link: "/track",
            },
          );

          if (settings.pushNotification && settings.pushSubscription) {
            const {
              sendPushNotification,
            } = require("../services/webPushService");
            await sendPushNotification(settings.pushSubscription, {
              title: "Reminder!",
              body: reminderMessage,
              url: "/track",
            });
          } else {
            console.log(`Push skipped for user ${user._id}`);
          }
        } catch (err) {
          console.error(`Error processing user ${user._id}:`, err);
        }
      }),
    );
  } catch (err) {
    console.error("Error sending daily tracking reminders:", err);
  }
};

module.exports = sendDailyTrackingReminders;
