const express = require('express');
const CommunityService = require('../services/communityService');
const LeaderboardService = require('../services/leaderboardService')
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const multer = require('../utils/multer');

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new post with an image
router.post('/posts', (req, res) => {
  multer.uploadCommunityImage.single('image')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    try {
      const content = req.body.content;
      const image = req.file ? req.file.path : null;
      const userId = req.user._id;

      if (!content && !image) {
        return res.status(400).json({ error: 'Content or image is required' });
      }

      const newPost = await CommunityService.createPost({ userId, content, image });
      const obj = newPost.toObject();
      const postWithFlags = {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId.toString()),
        isReposted: obj.reposts.some((id) => id.toString() === userId.toString()),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
      };

      await LeaderboardService.addPoints(userId, 100, 'Posted in Community Page');

      res.status(201).json({ success: true, data: postWithFlags });
    } catch (error) {
      console.error('Create post error:', error);
      if (error.message === 'User profile not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  });
});



router.get('/user/post/:postId', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await CommunityService.getPostById(postId);
    res.json(post);
  } catch (error) {
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }

    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all posts and reposts by the current user
router.get('/user/posts', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const posts = await CommunityService.getUserPostsAndReposts(userId);

    const postsWithFlags = posts.map((post) => {
      const obj = post.toObject();
      return {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId),
        isReposted: obj.reposts.some((id) => id.toString() === userId),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
      };
    });

    res.json(postsWithFlags);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get all posts with flags for likes, reposts, and comments
router.get('/posts', async (req, res) => {
  try {
    const posts = await CommunityService.getPosts();
    const userId = req.user._id.toString();

    const postsWithFlags = posts.map((post) => {
      const obj = post.toObject();
      return {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId),
        isReposted: obj.reposts.some((id) => id.toString() === userId),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
      };
    });

    res.json(postsWithFlags);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like a post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const updatedPost = await CommunityService.likePost(req.params.id, req.user._id);
    // Add flags (same as GET)
    const userId = req.user._id.toString();
    const obj = updatedPost.toObject();
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
    };
    res.json(postWithFlags);
  } catch (error) {
    console.error('Like post error:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Repost a post
router.post('/posts/:id/repost', async (req, res) => {
  try {
    // Call the repostPost service function
    const updatedPost = await CommunityService.repostPost(req.params.id, req.user._id);

    // Add flags like isLiked, isReposted, likesCount, repostsCount (same as GET)
    const userId = req.user._id.toString();
    const obj = updatedPost.toObject();

    // Build the response object with flags
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
    };

    // Return the updated post with flags
    res.json(postWithFlags);

  } catch (error) {
    console.error('Repost error:', error);
    
    // Handle specific error for "Post not found"
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }

    // General error response
    res.status(500).json({ error: error.message });
  }
});


// Add a comment to a post
router.post('/posts/:id/comment', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    const updatedPost = await CommunityService.addComment(req.params.id, req.user._id, content);
    // Add flags (same as GET)
    const userId = req.user._id.toString();
    const obj = updatedPost.toObject();
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
    };
    res.json(postWithFlags);
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a comment from a post
router.delete('/posts/:postId/comment/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    await CommunityService.deleteComment(postId, commentId, userId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete('/posts/:id', async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    await CommunityService.deletePost(postId, userId);

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: error.message });
  }
});



router.patch('/posts/:id', multer.uploadCommunityImage.single('image'), async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const content = req.body.content;
    const image = req.file ? req.file.path : undefined;

    if (!content && !image) {
      return res.status(400).json({ error: 'No content or image provided for update' });
    }

    const updatedPost = await CommunityService.updatePost(postId, userId, { content, image });

    // Add flags for response
    const obj = updatedPost.toObject();
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId.toString()),
      isReposted: obj.reposts.some((id) => id.toString() === userId.toString()),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
    };

    res.json({ success: true, data: postWithFlags });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;