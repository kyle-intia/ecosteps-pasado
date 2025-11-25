const Notification = require('../models/notificationModel');
const socketIo = require('socket.io');

// Notification Service class
class NotificationService {
  static io; 

  // Set up socket.io instance
  static setSocketIoInstance(ioInstance) {
    NotificationService.io = ioInstance;
  }

  // Create a new notification and save it to the DB
static async createNotification(userId, message, type = 'community', options = {}) {
  try {
    const { link, postId, actorId, action } = options;

    const dateOnly = new Date().toISOString().slice(0, 10);

    const notification = new Notification({
      userId,
      message,
      type,
      dateOnly,
      link,                    // save deep link
      data: { postId, actorId, action }  // structured data
    });

    await notification.save();

    // Emit real-time with full data
    if (NotificationService.io) {
      NotificationService.io.to(userId.toString()).emit('notification', {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        data: notification.data,
        createdAt: notification.createdAt
      });
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

}

module.exports = NotificationService;
