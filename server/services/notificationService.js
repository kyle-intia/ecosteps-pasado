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
  static async createNotification(userId, message, type) {
    try {
    const dateOnly = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

    const newNotification = new Notification({
      userId,
      message,
      type,
      dateOnly,
    });

    await newNotification.save();

    if (NotificationService.io) {
      NotificationService.io.to(userId.toString()).emit('notification', { message });
    }

    return newNotification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw new Error('Error creating notification');
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
