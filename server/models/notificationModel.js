const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String , required: true },
  isRead: { type: Boolean, default: false },
  dateOnly: { type: String }, 

  // ADD THESE FIELDS
  link: { type: String },                    
  data: {                                    
    postId: { type: mongoose.Schema.Types.ObjectId },
    actorId: { type: mongoose.Schema.Types.ObjectId },
    action: { type: String }
  },

  createdAt: { type: Date, default: Date.now }
});
// Create the Notification model
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
 