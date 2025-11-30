// services/communityService.js
const NotificationService = require('../services/notificationService');
const UserModel = require('../models/user.model');
const LeaderboardService = require('../services/leaderboardService');
const Follow = require('../models/followModel');
const mongoose = require('mongoose');
const Post = require('../models/communityModel');
const UserProfileModel = require('../models/userprofile.model').default;


class CommunityService {

  static basePostPopulate(query) {
    return query
      .populate({
        path: 'author',
        model: 'User',
        select: '_id email profilePic',
        options: { lean: true }
      })
      .populate({
        path: 'comments.author',
        model: 'User',
        select: '_id',
        options: { lean: true }
      })
      .populate({
        path: 'repostsDetails.repostedBy',
        model: 'User',
        select: '_id',
        options: { lean: true }
      })
      .populate({
        path: 'sharesDetails.sharedBy',
        model: 'User',
        select: '_id',
        options: { lean: true }
      });
  }

  static async attachProfilesToPosts(posts) {
    if (!posts || posts.length === 0) return posts;

    const userIds = new Set();
    posts.forEach(p => {
      if (p.author && p.author._id) userIds.add(p.author._id.toString());
      if (Array.isArray(p.comments)) {
        p.comments.forEach(c => {
          if (c.author && c.author._id) userIds.add(c.author._id.toString());
        });
      }
      if (Array.isArray(p.repostsDetails)) {
        p.repostsDetails.forEach(r => { if (r.repostedBy && r.repostedBy._id) userIds.add(r.repostedBy._id.toString()); });
      }
      if (Array.isArray(p.sharesDetails)) {
        p.sharesDetails.forEach(s => { if (s.sharedBy && s.sharedBy._id) userIds.add(s.sharedBy._id.toString()); });
      }
    });

    const ids = Array.from(userIds).map(id => new mongoose.Types.ObjectId(id));
    if (ids.length === 0) return posts;

    const UserProfile = mongoose.model('users_profile');
    const profiles = await UserProfile.find({ userId: { $in: ids } })
      .select('userId firstName lastName username profilePic')
      .lean()
      .exec();

    const profileMap = new Map();
    profiles.forEach(p => profileMap.set(p.userId.toString(), p));

    const attach = (userRef) => {
      if (!userRef || !userRef._id) return null;
      const pr = profileMap.get(userRef._id.toString());
      if (pr) return pr;
      return { userId: userRef._id };
    };

    return posts.map(p => {
      const obj = (p.toObject) ? p.toObject() : p;
      obj.authorProfile = attach(obj.author);
      if (Array.isArray(obj.comments)) {
        obj.comments = obj.comments.map(c => ({ ...c, authorProfile: attach(c.author) }));
      }
      if (Array.isArray(obj.repostsDetails)) {
        obj.repostsDetails = obj.repostsDetails.map(r => ({ ...r, repostedByProfile: attach(r.repostedBy) }));
      }
      if (Array.isArray(obj.sharesDetails)) {
        obj.sharesDetails = obj.sharesDetails.map(s => ({ ...s, sharedByProfile: attach(s.sharedBy) }));
      }
      return obj;
    });
  }

  // Create a post (defaults to public)
  static async createPost({ userId, content, image, visibility = 'public' }) {
    const newPost = new Post({
      author: userId,
      content,
      image,
      visibility
    });
    await newPost.save();

    // return single populated post (lean)
    const post = await this.basePostPopulate(Post.findById(newPost._id)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([post]);
    return attached;
  }

  // Get single post with visibility check (viewerId optional)
  static async getPostById(postId, viewerId = null) {
    const postDoc = await Post.findById(postId).lean().exec();
    if (!postDoc) throw new Error('Post not found');

    // If private, ensure viewer is owner (or optionally follower) — current policy: only owner can see
    if (postDoc.visibility === 'private') {
      if (!viewerId || postDoc.author.toString() !== viewerId.toString()) {
        throw new Error('Post not found'); // hide existence for unauthorized users
      }
    }

    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

  // Get posts for a user (their posts & reposts/shares). Includes private posts only for owner.
  static async getUserPostsAndReposts(userId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;

    const posts = await this.basePostPopulate(
      Post.find({
        $or: [
          { author: userId },
          { reposts: userId },
          { shares: userId }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ).lean().exec();

    return await this.attachProfilesToPosts(posts);
  }

  static async getPublicPosts({ page = 1, limit = 10, sort = 'recent', search } = {}) {
    const skip = (page - 1) * limit;

    let query = { visibility: 'public' };

    let sortOptions = {};

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };

      sortOptions = { score: { $meta: "textScore" }, ...sortOptions };
    }

    switch (sort) {
      case 'popular':
        sortOptions = { likes: -1, createdAt: -1 };
        break;

      case 'trending':
        // Trending filter = last 24h
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        query.createdAt = { $gte: last24h };

        sortOptions = { 
          engagementScore: -1,
          createdAt: -1
        };
        break;

      case 'recent':
      default:
        sortOptions = { createdAt: -1 };
        break;
    }

    // Aggregation pipeline for trending
    let posts;
    if (sort === 'trending') {
      posts = await Post.aggregate([
        { $match: query },
        {
          $addFields: {
            engagementScore: {
              $add: [
                { $size: { $ifNull: ['$likes', []] } },
                { $size: { $ifNull: ['$reposts', []] } },
                { $size: { $ifNull: ['$shares', []] } },
                { $size: { $ifNull: ['$comments', []] } }
              ]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            let: { authorId: "$author" }, // variable for localField
            pipeline: [
              {
                $match: { $expr: { $eq: ["$_id", "$$authorId"] } }
              },
              {
                $project: { _id: 1, email: 1 } // select only _id and email
              }
            ],
            as: "author"
          }
        },
              { $unwind: "$author" },
        {
          $lookup: {
            from: "users",
            let: { commentAuthorIds: "$comments.author" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$commentAuthorIds"] } } },
              { $project: { _id: 1, email: 1 } } // only _id and email
            ],
            as: "commentAuthors"
          }
        },
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "c",
                in: {
                  $mergeObjects: [
                    "$$c",
                    {
                      author: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentAuthors",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$c.author"] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $addFields: {
            comments: {
              $map: {
                input: "$comments",
                as: "c",
                in: {
                  $mergeObjects: [
                    "$$c",
                    {
                      author: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$commentAuthors",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$c.author"] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            let: { repostedByIds: "$repostsDetails.repostedBy" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$repostedByIds"] } } },
              { $project: { _id: 1, email: 1 } }
            ],
            as: "repostedUsers"
          }
        },
        {
          $addFields: {
            repostsDetails: {
              $map: {
                input: "$repostsDetails",
                as: "r",
                in: {
                  $mergeObjects: [
                    "$$r",
                    {
                      repostedBy: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$repostedUsers",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$r.repostedBy"] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "sharesDetails.sharedBy",
            foreignField: "_id",
            as: "sharedUsers"
          }
        },
        {
          $addFields: {
            sharesDetails: {
              $map: {
                input: "$sharesDetails",
                as: "s",
                in: {
                  $mergeObjects: [
                    "$$s",
                    {
                      sharedBy: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$sharedUsers",
                              as: "u",
                              cond: { $eq: ["$$u._id", "$$s.sharedBy"] }
                            }
                          },
                          0
                        ]
                      }
                    }
                  ]
                }
              }
            }
          }
        },
        { $sort: sortOptions },
        { $skip: skip },
        { $limit: limit + 1 }
      ]);
    } else {
      posts = await this.basePostPopulate(
        Post.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit + 1)
      ).lean().exec();
    }

    const attached = await this.attachProfilesToPosts(posts);

    const hasMore = attached.length > limit;
    const result = hasMore ? attached.slice(0, limit) : attached;

    return result;
  }

  static async getFollowingFeed(userId, { page = 1, limit = 10 } = {}) {
    const follows = await Follow.find({ follower: userId }).select('following').lean().exec();
    const followingIds = follows.map(f => f.following).filter(Boolean);
    if (followingIds.length === 0) {
      return { posts: [], hasMore: false };
    }

    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { author: { $in: followingIds }, visibility: 'public' },
        { reposts: { $in: followingIds } },
        { shares: { $in: followingIds } }
      ]
    };

    const posts = await this.basePostPopulate(
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1)
    ).lean().exec();

    const attached = await this.attachProfilesToPosts(posts);
    const hasMore = attached.length > limit;
    const sliced = hasMore ? attached.slice(0, limit) : attached;

    return { posts: sliced, hasMore, page, limit };
  }

    // Like/unlike
  static async likePost(postId, userId) {
    const userProfile = await UserProfileModel.findOne({ userId }).select("username").lean().exec();
    const username = userProfile?.username || "Someone";

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    // Define recipientId ONCE at the top so it's available in both branches
    const recipientId = post.author.toString();
    const isOwnPost = recipientId === userId.toString();

    const likedIndex = post.likes.findIndex((id) => id.toString() === userId.toString());

    if (likedIndex === -1) {
      // === LIKE ===
      post.likes.push(userId);

      if (!isOwnPost) {
        await NotificationService.createNotification(
          recipientId,
          `@${username} liked your post`,
          'community',
          {
            link: `/post/${postId}`,
            postId,
            actorId: userId,
            action: 'like'
          }
        );
      }
    } else {
      post.likes.splice(likedIndex, 1);

      if (!isOwnPost) {
        await NotificationService.deleteActionNotification({
          recipientId,
          actorId: userId,
          action: 'like',
          postId
        });
      }
    }

    await post.save();

    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

    // Repost
  static async repostPost(postId, userId) {
    const userProfile = await UserProfileModel.findOne({ userId }).select("username").lean().exec();
    const username = userProfile?.username || "Someone";
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const recipientId = post.author.toString();
    const isOwnPost = recipientId === userId.toString();

    const isAlreadyReposted = post.reposts.some(id => id.toString() === userId.toString());

    if (!isAlreadyReposted) {
      // === REPOST ===
      post.reposts.push(userId);
      post.repostsDetails.push({
        repostedBy: userId,
        repostedPost: post._id,
      });

      if (!isOwnPost) {
        await NotificationService.createNotification(
          recipientId,
          `@${username} reposted your post`,
          'community',
          {
            link: `/post/${postId}`,
            postId,
            actorId: userId,
            action: 'repost'
          }
        );
      }
    } else {
      // === UN-REPOST ===
      post.reposts = post.reposts.filter(id => id.toString() !== userId.toString());
      post.repostsDetails = post.repostsDetails.filter(
        entry => entry.repostedBy.toString() !== userId.toString()
      );

      if (!isOwnPost) {
        await NotificationService.deleteActionNotification({
          recipientId,
          actorId: userId,
          action: 'repost',
          postId
        });
      }
    }

    await post.save();
    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

  static async sharePost(postId, userId) {
    const userProfile = await UserProfileModel.findOne({ userId }).select("username").lean().exec();
    const username = userProfile?.username || "Someone";
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const recipientId = post.author.toString();
    const isOwnPost = recipientId === userId.toString();

    const alreadyShared = post.shares.some(id => id.toString() === userId.toString());

    if (!alreadyShared) {
      // === SHARE ===
      post.shares.push(userId);
      post.sharesDetails.push({
        sharedBy: userId,
        sharedPost: post._id,
      });

      if (!isOwnPost) {
        await NotificationService.createNotification(
          recipientId,
          `@${username} shared your post`,
          'community',
          {
            link: `/post/${postId}`,
            postId,
            actorId: userId,
            action: 'shared'
          }
        );
      }
    } else {
      // === UNSHARE ===
      post.shares = post.shares.filter(id => id.toString() !== userId.toString());
      post.sharesDetails = post.sharesDetails.filter(
        entry => entry.sharedBy.toString() !== userId.toString()
      );

      if (!isOwnPost) {
        await NotificationService.deleteActionNotification({
          recipientId,
          actorId: userId,
          action: 'shared',
          postId
        });
      }
    }

    await post.save();
    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

  // Comment
  static async addComment(postId, userId, commentContent) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found'); 

    post.comments.push({ author: userId, content: commentContent });
    await post.save();  

    const userProfile = await UserProfileModel.findOne({ userId }).select("username").lean().exec();
    const username = userProfile?.username || "Someone";

    const recipientId = post.author.toString();
    if (recipientId !== userId.toString()) {
      await NotificationService.createNotification(
        recipientId,
        `@${username} commented on your post`,
        'community', 
        {
          link: `/post/${postId}`,
          postId,
          actorId: userId,
          action: 'comment',
          content: commentContent
        }
      );
    } 

    // 5. Populate and attach profiles
    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }


  static async deleteComment(postId, commentId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) throw new Error('Comment not found');

    const comment = post.comments[commentIndex];
    if (comment.author.toString() !== userId.toString()) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }

    const recipientId = post.author.toString();
    const isOwnPost = recipientId === userId.toString();

    // Remove comment
    post.comments.splice(commentIndex, 1);

    // Delete notification if it was sent (i.e. not own post)
    if (!isOwnPost) {
      await NotificationService.deleteActionNotification({
        recipientId,
        actorId: userId,
        action: 'comment',
        postId: post._id
      });
    }

    await post.save();

    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

  static async deletePost(postId, userId) {
    const post = await Post.findById(postId).lean().exec();
    if (!post) throw new Error('Post not found');

    if (post.author.toString() !== userId.toString()) {
      throw new Error('Unauthorized: You can only delete your own post');
    }

    await Post.findByIdAndDelete(postId);
    return { success: true };
  }

  static async updatePost(postId, userId, updatedData) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    if (post.author.toString() !== userId.toString()) {
      throw new Error('Unauthorized: You can only edit your own post');
    }

    if (updatedData.content !== undefined) post.content = updatedData.content;
    if (updatedData.image !== undefined) post.image = updatedData.image;
    if (updatedData.visibility !== undefined) post.visibility = updatedData.visibility;

    await post.save();

    const populated = await this.basePostPopulate(Post.findById(postId)).lean().exec();
    const [attached] = await this.attachProfilesToPosts([populated]);
    return attached;
  }

  // Follow / Unfollow
  static async followUser(followerId, followingId) {
    if (followerId.toString() === followingId.toString()) {
      throw new Error('Cannot follow yourself');
    }

    try {
      await Follow.create({ follower: followerId, following: followingId });

      const follower= await UserProfileModel.findOne({ followerId }).select("username").lean().exec();
      const username = follower?.username || "Someone";
      await NotificationService.createNotification(
        followingId,
        `${username} started following you`,
        'community',
        {
          link: null,
          actorId: followerId,
          action: 'follow'
        }
      );
      return { success: true };
    } catch (err) {
      if (err.code === 11000) {
        return { success: true }; // already following
      }
      throw err;
    }
  }

  static async unfollowUser(followerId, followingId) {
    if (followerId.toString() === followingId.toString()) {
      throw new Error('Cannot unfollow yourself');
    }

    await Follow.deleteOne({ follower: followerId, following: followingId });

    // Delete the follow notification
    await NotificationService.deleteActionNotification({
      recipientId: followingId,
      actorId: followerId,
      action: 'follow'
      // no postId → ignored in query
    });

    return { success: true };
  }

  // Get following IDs (User._id array of users the given user follows)
  static async getFollowingIds(userId) {
    const follows = await Follow.find({ follower: userId }).select('following').lean().exec();
    return follows.map(f => f.following.toString());
  }

  static async getFollowers(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const followers = await Follow.find({ following: userId })
      .skip(skip)
      .limit(limit)
      .populate('follower', 'email') 
      .lean()
      .exec();
    return followers;
  }

  static async getFollowingList(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const following = await Follow.find({ follower: userId })
      .skip(skip)
      .limit(limit)
      .populate('following', 'email')
      .lean()
      .exec();
    return following;
  }
}

module.exports = CommunityService;
