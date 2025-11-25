// routes/communityRoute.js
const express = require('express');
const CommunityService = require('../services/communityService');
const LeaderboardService = require('../services/leaderboardService');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const multer = require('../utils/multer');

// -------------------- PUBLIC ROUTES (no auth) --------------------

// Get single post by id (public accessible if post is public, otherwise only owner)
router.get('/posts/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const viewerId = req.user ? req.user._id : null; // undefined if not authenticated
    try {
      const post = await CommunityService.getPostById(postId, viewerId);
      const userId = viewerId ? viewerId.toString() : null;
      const obj = post;
      const postWithFlags = {
        ...obj,
        isLiked: userId ? obj.likes.some((id) => id.toString() === userId) : false,
        isReposted: userId ? obj.reposts.some((id) => id.toString() === userId) : false,
        isShared: userId ? obj.shares.some((id) => id.toString() === userId) : false,
        likesCount: (obj.likes || []).length,
        repostsCount: (obj.reposts || []).length,
        sharesCount: (obj.shares || []).length,
      };
      res.json(postWithFlags);
    } catch (err) {
      if (err.message === 'Post not found') {
        return res.status(404).json({ error: err.message });
      }
      throw err;
    }
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all public posts (paginated) — accessible without auth
router.get('status/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const posts = await CommunityService.getPublicPosts({ page, limit });

    // when unauthenticated, flags are false
    const userId = req.user ? req.user._id.toString() : null;

    const postsWithFlags = posts.map((post) => {
      const obj = (post);
      return {
        ...obj,
        isLiked: userId ? obj.likes.some((id) => id.toString() === userId) : false,
        isReposted: userId ? obj.reposts.some((id) => id.toString() === userId) : false,
        isShared: userId ? obj.shares.some((id) => id.toString() === userId) : false,
        likesCount: (obj.likes || []).length,
        repostsCount: (obj.reposts || []).length,
        sharesCount: (obj.shares || []).length,
      };
    });

    res.json(postsWithFlags);
  } catch (error) {
    console.error('Get public posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// -------------------- AUTHENTICATED ROUTES --------------------
router.use(authenticate);

// Get all public posts (paginated) — accessible without auth
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const sort = req.query.sort || 'recent';
    const search = req.query.search || ''; 

    const posts = await CommunityService.getPublicPosts({ 
      page, 
      limit, 
      sort, 
      search 
    });

    const userId = req.user?._id?.toString();

    const postsWithFlags = posts.map((post) => ({
      ...post,
      isLiked: userId ? post.likes?.some(id => id.toString() === userId) : false,
      isReposted: userId ? post.reposts?.some(id => id.toString() === userId) : false,
      isShared: userId ? post.shares?.some(id => id.toString() === userId) : false,
      likesCount: post.likes?.length || 0,
      repostsCount: post.reposts?.length || 0,
      sharesCount: post.shares?.length || 0,
    }));

    res.json(postsWithFlags);
  } catch (error) {
    console.error('Get public posts error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Create a new post with an image
router.post('/posts', (req, res) => {
  multer.uploadCommunityImage.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const content = req.body.content;
      const image = req.file ? req.file.path : null;
      const visibility = req.body.visibility || 'public'; // allow setting visibility
      const userId = req.user._id;

      if (!content && !image) {
        return res.status(400).json({ error: 'Content or image is required' });
      }

      const newPost = await CommunityService.createPost({ userId, content, image, visibility });

      // prepare flags
      const obj = newPost;
      const postWithFlags = {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId.toString()),
        isReposted: obj.reposts.some((id) => id.toString() === userId.toString()),
        isShared: obj.shares.some((id) => id.toString() === userId.toString()),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
        sharesCount: obj.shares.length,
      };

      await LeaderboardService.addPoints(userId, 100, 'Posted in Community Page');

      res.status(201).json({ success: true, data: postWithFlags });
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ error: error.message });
    }
  });
});

// Get logged-in user's posts and reposts (paginated)
router.get('/user/posts', async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);

    const posts = await CommunityService.getUserPostsAndReposts(userId, { page, limit });

    const postsWithFlags = posts.map((post) => {
      const obj = post;
      return {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId),
        isReposted: obj.reposts.some((id) => id.toString() === userId),
        isShared: obj.shares.some((id) => id.toString() === userId),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
        sharesCount: obj.shares.length,
      };
    });

    res.json(postsWithFlags);
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Following feed (posts from users you follow) with pagination
router.get('/posts/feed/following', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '10', 10);
    const userId = req.user._id.toString();

    const { posts, hasMore } = await CommunityService.getFollowingFeed(userId, { page, limit });

    const postsWithFlags = posts.map((post) => {
      const obj = post;
      return {
        ...obj,
        isLiked: obj.likes.some((id) => id.toString() === userId),
        isReposted: obj.reposts.some((id) => id.toString() === userId),
        isShared: obj.shares.some((id) => id.toString() === userId),
        likesCount: obj.likes.length,
        repostsCount: obj.reposts.length,
        sharesCount: obj.shares.length,
      };
    });

    res.json({ posts: postsWithFlags, hasMore, page, limit });
  } catch (error) {
    console.error('Following feed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Like, repost, share, comment, update, delete remain mostly same but hitting service new methods
router.post('/posts/:id/like', async (req, res) => {
  try {
    const updatedPost = await CommunityService.likePost(req.params.id, req.user._id);
    const userId = req.user._id.toString();
    const obj = updatedPost;
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      isShared: obj.shares.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
      sharesCount: obj.shares.length,
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

router.post('/posts/:id/repost', async (req, res) => {
  try {
    const updatedPost = await CommunityService.repostPost(req.params.id, req.user._id);
    const userId = req.user._id.toString();
    const obj = updatedPost;
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      isShared: obj.shares.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
      sharesCount: obj.shares.length,
    };
    res.json(postWithFlags);
  } catch (error) {
    console.error('Repost error:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/posts/:id/share', async (req, res) => {
  try {
    const updatedPost = await CommunityService.sharePost(req.params.id, req.user._id);
    const userId = req.user._id.toString();
    const obj = updatedPost;
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      isShared: obj.shares.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
      sharesCount: obj.shares.length,
    };
    res.json(postWithFlags);
  } catch (error) {
    console.error('Share error:', error);
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

// Comment
router.post('/posts/:id/comment', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content is required' });

    const updatedPost = await CommunityService.addComment(req.params.id, req.user._id, content);
    const userId = req.user._id.toString();
    const obj = updatedPost;
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId),
      isReposted: obj.reposts.some((id) => id.toString() === userId),
      isShared: obj.shares.some((id) => id.toString() === userId),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
      sharesCount: obj.shares.length,
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

// Delete comment
router.delete('/posts/:postId/comment/:commentId', async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    await CommunityService.deleteComment(postId, commentId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete comment error', error);
    res.status(500).json({ error: error.message });
  }
});

// Update post (supports visibility change)
router.patch('/posts/:id', multer.uploadCommunityImage.single('image'), async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    const content = req.body.content;
    const image = req.file ? req.file.path : undefined;
    const visibility = req.body.visibility; // optional: 'public' | 'private'

    if (!content && !image && visibility === undefined) {
      return res.status(400).json({ error: 'No content, image, or visibility provided for update' });
    }

    const updatedPost = await CommunityService.updatePost(postId, userId, { content, image, visibility });

    const obj = updatedPost;
    const postWithFlags = {
      ...obj,
      isLiked: obj.likes.some((id) => id.toString() === userId.toString()),
      isReposted: obj.reposts.some((id) => id.toString() === userId.toString()),
      isShared: obj.shares.some((id) => id.toString() === userId.toString()),
      likesCount: obj.likes.length,
      repostsCount: obj.reposts.length,
      sharesCount: obj.shares.length,
    };

    res.json({ success: true, data: postWithFlags });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete post
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

// Follow / unfollow
router.post('/user/:userId/follow', async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    await CommunityService.followUser(followerId, followingId);
    res.json({ success: true });
  } catch (err) {
    console.error('Follow error', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/user/:userId/unfollow', async (req, res) => {
  try {
    const followerId = req.user._id;
    const followingId = req.params.userId;
    await CommunityService.unfollowUser(followerId, followingId);
    res.json({ success: true });
  } catch (err) {
    console.error('Unfollow error', err);
    res.status(500).json({ error: err.message });
  }
});

// Followers/following lists
router.get('/followers/:userId', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const followers = await CommunityService.getFollowers(req.params.userId, { page, limit });
    res.json(followers);
  } catch (err) {
    console.error('Get followers error', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/following', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const following = await CommunityService.getFollowingList(req.user._id, { page, limit });
    res.json(following);
  } catch (err) {
    console.error('Get following error', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
