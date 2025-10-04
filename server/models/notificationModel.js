const mongoose = require('mongoose');

// Define the Notification schema
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  type: { type: String, required: true }, 
  dateOnly: { type: String, required: true },
}, {
  timestamps: true, // adds createdAt and updatedAt automatically
});

// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
 