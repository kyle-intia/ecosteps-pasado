const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  type: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  dateOnly: { type: String },

  link: { type: String },
  data: {
    postId: { type: mongoose.Schema.Types.ObjectId },
    actorId: { type: mongoose.Schema.Types.ObjectId },
    action: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
});
const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
