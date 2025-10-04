const webpush = require('web-push');

webpush.setVapidDetails(
  'mailto:ecosteps@ecosteps.online',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendPushNotification = async (subscription, payload) => {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

module.exports = { sendPushNotification };
