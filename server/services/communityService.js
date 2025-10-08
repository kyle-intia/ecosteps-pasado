const Post = require('../models/communityModel');
const NotificationService = require('../services/notificationService');
const UserModel = require('../models/user.model')
const UserSettings = require('../models/userSettingsModel');

class CommunityService {

  static async createPost({ userId, content, image }) {
    const newPost = new Post({
      author: userId,
      content,
      image,
    });
    await newPost.save();
    // Query-based populate (reliable)
    return await Post.findById(newPost._id)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      });
  }

  static async getPostById(postId) {
    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      });

    if (!post) {
      throw new Error('Post not found');
    }

    return post;
  }

  static async getUserPostsAndReposts(userId) {
    const posts = await Post.find({
      $or: [
        { author: userId },
        { reposts: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .populate({
      path: 'author',
      model: 'users_profile',
      localField: 'author',
      foreignField: 'userId',
      justOne: true,
      select: 'firstName lastName username profilePic userId'
    })
    .populate({
      path: 'comments.author',
      model: 'users_profile',
      localField: 'comments.author',
      foreignField: 'userId',
      justOne: true,
      select: 'firstName lastName username profilePic userId'
    })
    .populate({
    path: 'repostsDetails.repostedBy',
    model: 'users_profile',
    localField: 'repostsDetails.repostedBy',
    foreignField: 'userId',
    select: 'firstName lastName username profilePic userId'
  });
  
    return posts;
  }

  static async getPosts() {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'repostsDetails.repostedBy',
        model: 'users_profile',
        localField: 'repostsDetails.repostedBy',
        foreignField: 'userId',
        select: 'firstName lastName username profilePic userId'
      });
    return posts;
  }

  static async likePost(postId, userId) {

    const user = await UserModel.findById(userId).select('email');
    const email = user.email;

    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    const likedIndex = post.likes.findIndex((id) => id.toString() === userId.toString());

    if (likedIndex === -1) {
      post.likes.push(userId);

      const recipientId = post.author.toString();

      if (recipientId !== userId.toString()) { // Don't notify yourself
        await NotificationService.createNotification(
          recipientId,
          `${email} liked your post`,
          "community",
        );
      }

    } else {
      post.likes.splice(likedIndex, 1);
    }

    await post.save();

    // Query-based populate
    return await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      });
  }

  static async repostPost(postId, userId) {

    const user = await UserModel.findById(userId).select('email');
    const email = user.email;

    const post = await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      });
  
    if (!post) throw new Error('Post not found');
  
    const isAlreadyReposted = post.reposts.includes(userId);
  
    if (!isAlreadyReposted) {
      post.reposts.push(userId);

      const recipientId = post.author.userId; 
      if (recipientId !== userId.toString()) { 
        await NotificationService.createNotification(
          recipientId,
          `${email} repost your post`,
          "community",
        );
      }
      post.repostsDetails.push({
        repostedBy: userId,
        repostedPost: post._id,
      });
    } else {
      // Un-repost: remove from both arrays
      post.reposts = post.reposts.filter(id => id.toString() !== userId.toString());
      post.repostsDetails = post.repostsDetails.filter(
        entry => entry.repostedBy.toString() !== userId.toString()
      );
    }
  
    await post.save();
  
    return await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'repostsDetails.repostedBy',
        model: 'users_profile',
        select: 'firstName lastName username profilePic userId'
      });
  }


  static async addComment(postId, userId, commentContent) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');

    post.comments.push({ author: userId, content: commentContent });
    await post.save();

    // Query-based populate
    return await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        localField: 'author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        localField: 'comments.author',
        foreignField: 'userId',
        justOne: true,
        select: 'firstName lastName username profilePic'
      });
  }

  static async deleteComment(postId, commentId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new Error('Post not found');
  
    const comment = post.comments.id(commentId);
    if (!comment) throw new Error('Comment not found');
  
    if (comment.author.toString() !== userId.toString()) {
      throw new Error('Unauthorized: You can only delete your own comments');
    }
  
    // Remove manually (not using comment.remove())
    post.comments = post.comments.filter(c => c._id.toString() !== commentId);
  
    await post.save();
  
    return post;
  }
  
  static async deletePost(postId, userId) {
    const post = await Post.findById(postId);
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

    if (updatedData.content !== undefined) {
      post.content = updatedData.content;
    }

    if (updatedData.image !== undefined) {
      post.image = updatedData.image;
    }

    await post.save();

    return await Post.findById(postId)
      .populate({
        path: 'author',
        model: 'users_profile',
        select: 'firstName lastName username profilePic'
      })
      .populate({
        path: 'comments.author',
        model: 'users_profile',
        select: 'firstName lastName username profilePic'
      });
  }


}

module.exports = CommunityService;