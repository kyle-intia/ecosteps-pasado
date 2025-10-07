const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users_profile',
    required: true,
  },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users_profile', required: true },
    content: String,
    image: String,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users_profile' }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users_profile' }],
    comments: [commentSchema],
    repostsDetails: [
    {
      repostedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users_profile' },
      repostedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' }
    }
],
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
