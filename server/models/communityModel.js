const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const repostDetailSchema = new mongoose.Schema(
  {
    repostedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    repostedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const shareDetailSchema = new mongoose.Schema(
  {
    sharedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true },
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String, default: "" },
    image: { type: String, default: null },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },

    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shares: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    comments: [commentSchema],
    repostsDetails: [repostDetailSchema],
    sharesDetails: [shareDetailSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

postSchema.virtual("likesCount").get(function () {
  return this.likes?.length || 0;
});
postSchema.virtual("repostsCount").get(function () {
  return this.reposts?.length || 0;
});
postSchema.virtual("sharesCount").get(function () {
  return this.shares?.length || 0;
});
postSchema.virtual("commentsCount").get(function () {
  return this.comments?.length || 0;
});
postSchema.virtual("engagementScore").get(function () {
  return (
    (this.likes?.length || 0) +
    (this.reposts?.length || 0) +
    (this.shares?.length || 0) +
    (this.comments?.length || 0)
  );
});

postSchema.index({ content: "text" });
postSchema.index({ visibility: 1, createdAt: -1 });
postSchema.index({ visibility: 1, likesCount: -1 });
postSchema.index({ visibility: 1, engagementScore: -1 });
postSchema.index({ visibility: 1, createdAt: -1, engagementScore: -1 });
postSchema.index({ author: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
