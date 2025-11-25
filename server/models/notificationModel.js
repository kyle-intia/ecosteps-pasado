const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['community', 'follow', 'achievement'], default: 'community' },
  isRead: { type: Boolean, default: false },
  dateOnly: { type: String }, // optional: '2025-04-05'

  // ADD THESE FIELDS
  link: { type: String },                    // e.g. "/post/abc123" or full URL
  data: {                                    
    postId: { type: mongoose.Schema.Types.ObjectId },
    actorId: { type: mongoose.Schema.Types.ObjectId }, // who triggered it
    action: { type: String, enum: ['like', 'repost', 'share', 'follow', 'comment'] }
  },

  createdAt: { type: Date, default: Date.now }
});
// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
 