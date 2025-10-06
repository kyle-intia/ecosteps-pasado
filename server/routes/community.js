const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Post, Comment } = require('../models/Community');
const User = require('../models/Leaderboards');
const { verifyToken } = require('../utils/jwt');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const { payload, error } = verifyToken(token);
  
  if (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};

// ============ USER ROUTES ============

// @route   GET /api/community/user/me
// @desc    Get current user from database
// @access  Protected
router.get('/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id.toString(), // Database ID as string
      name: user.name,
      email: user.email,
      score: user.score,
      badges: user.badges,
      activity: user.activity,
      posts: user.posts,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============ POSTS ROUTES ============

// @route   GET /api/community/posts
// @desc    Get all posts for community feed
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author.userId', 'fullName username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 posts
    
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/community/posts
// @desc    Create a new post
// @access  Public (In production, this should be protected)
router.post('/posts', async (req, res) => {
  try {
    const { content, image, authorId, authorName, authorUsername, authorAvatar } = req.body;

    if (!content || !authorId) {
      return res.status(400).json({ msg: 'Content and author ID are required' });
    }

    const newPost = new Post({
      author: {
        userId: authorId,
        name: authorName,
        username: authorUsername,
        avatar: authorAvatar
      },
      content,
      image
    });

    const post = await newPost.save();
    
    // Update user's post count
    await User.findByIdAndUpdate(authorId, { $inc: { posts: 1 } });

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/community/posts/:postId/like
// @desc    Like/unlike a post
// @access  Public (In production, this should be protected)
router.post('/posts/:postId/like', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const userIndex = post.likedBy.indexOf(userId);
    
    if (userIndex > -1) {
      // User already liked, so unlike
      post.likedBy.splice(userIndex, 1);
      post.likes = Math.max(0, post.likes - 1);
    } else {
      // User hasn't liked, so like
      post.likedBy.push(userId);
      post.likes += 1;
    }

    await post.save();
    res.json({ likes: post.likes, isLiked: userIndex === -1 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/community/posts/:postId/repost
// @desc    Repost/unrepost a post
// @access  Public (In production, this should be protected)
router.post('/posts/:postId/repost', async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const userIndex = post.repostedBy.indexOf(userId);
    
    if (userIndex > -1) {
      // User already reposted, so unrepost
      post.repostedBy.splice(userIndex, 1);
      post.reposts = Math.max(0, post.reposts - 1);
    } else {
      // User hasn't reposted, so repost
      post.repostedBy.push(userId);
      post.reposts += 1;
    }

    await post.save();
    res.json({ reposts: post.reposts, isReposted: userIndex === -1 });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/community/posts/:postId
// @desc    Get a specific post
// @access  Public
router.get('/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: 'Invalid post ID' });
    }

    const post = await Post.findById(postId)
      .populate('author.userId', 'fullName username avatarUrl');
    
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ============ COMMENT ROUTES ============

// @route   GET /api/community/posts/:postId/comments
// @desc    Get all comments for a specific post
// @access  Public
router.get('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: 'Invalid post ID' });
    }

    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 }) // Oldest comment first
      .limit(100); // Limit to 100 comments

    res.json(comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/community/posts/:postId/comments
// @desc    Create a new comment
// @access  Public (In production, this should be protected)
router.post('/posts/:postId/comments', async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, authorId, authorName, authorUsername, authorAvatar } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ msg: 'Invalid post ID' });
    }

    if (!content || !authorId) {
      return res.status(400).json({ msg: 'Content and author ID are required' });
    }

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    const newComment = new Comment({
      postId,
      author: {
        userId: authorId,
        name: authorName,
        username: authorUsername,
        avatar: authorAvatar
      },
      content
    });

    const comment = await newComment.save();
    
    // Update post's comment count
    await Post.findByIdAndUpdate(postId, { $inc: { comments: 1 } });

    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/community/comments/:commentId
// @desc    Edit a comment
// @access  Public (In production, this should be protected)
router.put('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: 'Invalid comment ID' });
    }

    if (!content) {
      return res.status(400).json({ msg: 'Content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.author.userId.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized to edit this comment' });
    }

    comment.content = content;
    comment.updatedAt = new Date();
    comment.isEdited = true;

    await comment.save();
    res.json(comment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/community/comments/:commentId
// @desc    Delete a comment
// @access  Public (In production, this should be protected)
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ msg: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ msg: 'Comment not found' });
    }

    // Check if user is the author of the comment
    if (comment.author.userId.toString() !== userId) {
      return res.status(403).json({ msg: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(commentId);
    
    // Update post's comment count
    await Post.findByIdAndUpdate(comment.postId, { $inc: { comments: -1 } });

    res.json({ msg: 'Comment deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

