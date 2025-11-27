const Notification = require('../models/notificationModel');
const UserSettings = require('../models/userSettingsModel');
const socketIo = require('socket.io');

// Notification Service class
class NotificationService {

  static io;

  static activeUsers = new Set();

  static setSocketIoInstance(ioInstance, activeUsersSet) {
    NotificationService.io = ioInstance;
    NotificationService.activeUsers = activeUsersSet;
  }

    // Create a new notification and save it to the DB
  static async createNotification(userId, message, type = 'community', options = {}) {
    try {

      const { link, postId, actorId, action, dateOnly: optionsDateOnly } = options;

      const notification = new Notification({
        userId,
        message,
        type,
        dateOnly: optionsDateOnly || new Date().toISOString().slice(0, 10), // use provided or default
        link: link || null,
        data: { postId, actorId, action }
      });
    
      await notification.save();

      // Emit real-time with full data
      if (NotificationService.io) {
        NotificationService.io.to(userId.toString()).emit('notification', {
          _id: notification._id,
          userId: notification.userId.toString(),
          message: notification.message,
          type: notification.type,
          link: notification.link,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }

        const settings = await UserSettings.findOne({ userId });

        if (settings?.pushNotification && settings?.pushSubscription) {
          const { sendPushNotification } = require('./webPushService');
        
          const userIdStr = userId.toString();
        
          // If user is CURRENTLY ONLINE → delay push by 3 minutes
          // If offline → send immediately
          const isOnline = NotificationService.activeUsers.has(userIdStr);
        
          const delayMs = isOnline ? 3 * 60 * 1000 : 0; // 3 minutes if online

          const getTitle = (type) => {
            const titles = {
              achievement: 'Achievement Unlocked!',
              certificate: 'Certificate Earned!',
              reward: 'New Reward Available!',
              'daily-tracking-reminder': 'Daily Tracking Reminder',
            };
            return titles[type] || 'New Notification';
          };
        
          setTimeout(async () => {
            try {
              await sendPushNotification(settings.pushSubscription, {
                title: getTitle(type),
                body: message,
                icon: '/logo192.png',
                badge: '/badge.png',
                url: link || '/notifications',
                tag: `notif-${notification._id}`, // dedupe
              });
              console.log(`Push sent to ${userId} (delayed: ${delayMs/1000}s)`);
            } catch (err) {
              console.error('Push failed:', err);
            }
          }, delayMs);
        }

      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw new Error('Failed to create notification');
    }
  }

  // Fetch unread notifications for a specific user
  static async getUserNotifications(userId) {
    try {
      const notifications = await Notification.find({ userId, isRead: false });
      return notifications;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      throw new Error('Error fetching notifications');
    }
  }

  // Mark a notification as read
  static async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
      return notification;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw new Error('Error marking notification as read');
    }
  }

  static async getAllNotification() {
    try {
      const notifications = await Notification.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            message: 1,
            isRead: 1,
            type: 1,
            link: 1,
            data: 1,
            dateOnly: 1,
            createdAt: 1,
            updatedAt: 1,
            user: {
              role: 1,
            }
          }
        }
      ]);

      return notifications;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      throw new Error('Error fetching notifications');
    }
  }

  // Delete a specific action-based notification (like, repost, comment, follow, etc.)
  static async deleteActionNotification({ recipientId, actorId, action, postId }) {
    try {
      const query = {
        userId: recipientId,
        'data.actorId': actorId,
        'data.action': action,
      };

      // For post-related actions (like, repost, comment, share)
      if (postId) {
        query['data.postId'] = postId;
      }

      const result = await Notification.deleteOne(query);

      // Optional: emit removal via socket if user is online
      if (NotificationService.io && result.deletedCount > 0) {
        NotificationService.io.to(recipientId.toString()).emit('notification_removed', {
          action,
          actorId,
          postId
        });
      }

      return result.deletedCount > 0;
    } catch (err) {
      console.error('Error deleting action notification:', err);
      return false;
    }
  }
}

module.exports = NotificationService;
