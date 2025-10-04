const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  score: { type: Number, default: 0 },
  badges: [{ type: String }],
  activity: { type: Number, default: 0 },
  posts: { type: Number, default: 0 },
  // Add other fields as necessary, like email, password hash, etc.
});

const User = mongoose.model('User', userSchema);

module.exports = User;
