import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Navbar } from "@/components/Navbar";
import { Heart, MessageCircle, Repeat2, Share, Camera, Users, Leaf, Trash2, Loader2, Edit, Share2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import useAuth from "../hooks/useAuth";

import {
  getCommunityPosts,
  createCommunityPost,
  likePost,
  repostPost,
  commentOnPost,
  deleteComment,
  deletePost,
} from "../lib/api";

import { formatDistanceToNow } from "date-fns";

interface Comment {
  _id: string;
  author: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePic: string;
  };
  content: string;
  timestamp: string;
}

interface Post {
  _id: string;
  author: {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePic: string;
  };
  content: string;
  image?: string | null;
  likes: string[];
  comments: Comment[];
  reposts: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
  isLiked: boolean;
  isReposted: boolean;
  likesCount: number;
  repostsCount: number;
}

const Community = () => {
  const [loading, setLoading] = useState(true);
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPost, setLoadingPost] = useState(false);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const { toast } = useToast();
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();
  const { user } = useAuth() as { user: { _id?: string } };

  const userId = user?._id;

  const handleSignOut = () => {
    signOut();
  };

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await getCommunityPosts();
        const data = res
          .filter((post: Post) => post.author)  
          .map((post: Post) => ({
            ...post,
            comments: post.comments ?? [],
          }));
        setPosts(data);
      } catch (error) {
        toast({
          title: "Failed to load posts",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [toast]);

  // New: Delete post handler
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setDeletingPostId(postId);
    try {
      await deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
      toast({
        title: "Post deleted",
        description: "Your post was removed successfully.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete post. Try again later.",
        variant: "destructive",
      });
    } finally {
      setDeletingPostId(null);
    }
  };

  const handlePost = async () => {
      if (!postContent.trim() && !selectedImage) {
        toast({
          title: "Empty post",
          description: "Please write something or add an image before posting!",
          variant: "destructive",
        });
      return;
    }

    setLoadingPost(true);
    try {
      const formData = new FormData();
      formData.append("content", postContent);
      if (selectedImage) formData.append("image", selectedImage);

      const res = await createCommunityPost(formData);
      const newPost = res.data;  // Now includes flags from backend

      setPosts(prev => [newPost, ...prev]);
      setPostContent("");
      setSelectedImage(null);

      toast({
        title: "Post shared!",
        description: "Your eco journey has been shared with the community.",
      });
    } catch (error) {
        console.error("Post error:", error);

        const message = 
          error?.message ||
          "Could not share your post. Try again later.";

        toast({
          title: "Post failed",
          description: message,
          variant: "destructive",
        });
    } finally {
      setLoadingPost(false);
    }
  };


  const handleLike = async (postId: string) => {
    try {
      const updatedPost = await likePost(postId);

      setPosts(prev =>
        prev.map(post => (post._id === postId ? updatedPost : post))
      );

      const isLiked = updatedPost.likes.some(
        (id: string) => id.toString() === userId 
      );

      toast({
        title: isLiked ? "Post Liked" : "Like Removed",
        description: isLiked
          ? "You liked the post."
          : "You unliked the post.",
        variant: isLiked ? "success" : "destructive",
      });
    } catch (error) {
      console.error("Like post error:", error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };

  const handleRepost = async (postId: string) => {
    try {
      const updatedPost = await repostPost(postId);

      setPosts(prev =>
        prev.map(post => (post._id === postId ? updatedPost : post))
      );

      // Check if current user still reposted the post
      const isReposted = updatedPost.reposts.some(
        (id: string) => id.toString() === userId
      );

      toast({
        title: isReposted ? "Post Reposted" : "Repost Removed",
        description: isReposted
          ? "You've shared this post."
          : "You removed the repost.",
        variant: isReposted ? "success" : "destructive",
      });
    } catch (error) {
      console.error("Repost error:", error);
      toast({
        title: "Error",
        description: "Failed to update repost status",
        variant: "destructive",
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>, postId: string) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("comment") as HTMLInputElement;
    const content = input.value;

    if (!content.trim()) return;

    try {
      const res = await commentOnPost(postId, content);
      const updatedPost = res;  // Use res directly (whole post)

      setPosts(prev =>
        prev.map(post => (post._id === postId ? { ...post, comments: updatedPost.comments } : post))
      );
      (form.elements.namedItem("comment") as HTMLInputElement).value = "";  // Clear input
    } catch (error) {
      console.error("Comment error:", error);
      toast({
        title: "Comment failed",
        description: "Couldn't add your comment.",
        variant: "destructive",
      });
    }
  };

  // New: Delete comment handler
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setDeletingCommentId(commentId);
    try {
      await deleteComment(postId, commentId);
      setPosts(posts.map(post =>
        post._id === postId
          ? { ...post, comments: post.comments.filter(c => c._id !== commentId) }
          : post
      ));
      toast({
        title: "Comment deleted",
        description: "Your comment was removed successfully.",
      });
    } catch {
      toast({
        title: "Delete failed",
        description: "Could not delete comment. Try again later.",
        variant: "destructive",
      });
    } finally {
      setDeletingCommentId(null);
    }
  };


  useEffect(() => {
    let objectUrl: string | null = null;
    if (selectedImage) {
      objectUrl = URL.createObjectURL(selectedImage);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  if (isPending) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            EcoStep Community
          </h1>
          <p className="text-muted-foreground">
            Share your eco-friendly journey and inspire others to make a positive impact
          </p>
        </div>

        {/* Create Post Card */}
        <Card className="shadow-card border-border mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-success" />
              Share Your Eco Journey
            </CardTitle>
            <CardDescription>What eco-friendly action did you take today?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="What eco-friendly action did you take today?"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              className="min-h-[100px] resize-none"
            />

            {selectedImage && (
              <div className="flex flex-column justify-center items-center space-x-4">
                <img
                  src={selectedImage ? URL.createObjectURL(selectedImage) : ""}
                  alt="Selected"
                  className="rounded"
                  style={{ maxWidth: "200px", height: "auto" }} // smaller preview size
                />
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Photo
              </Button>

              {selectedImage && (  
                <Button  variant="destructive" onClick={() => setSelectedImage(null)} >
                  Cancel
                </Button>
              )}

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setSelectedImage(e.target.files[0]);
                  }
                }}
              />
                <Button
                  onClick={handlePost}
                  disabled={loadingPost || (!postContent.trim() && !selectedImage)}
                >
                  {loadingPost ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loadingPost ? "Sharing..." : "Share Post"}
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="shadow-card border-border">
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share your eco-friendly journey with the community!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card
                key={post._id}
                className="shadow-card border-border hover:shadow-elevated transition-smooth"
              >
                <CardContent className="p-6">
                  {/* Post Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar>
                      {post.author.profilePic ? (
                        <AvatarImage src={post.author.profilePic} alt={post.author.username} />
                      ) : (
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {post.author.firstName
                            ? post.author.firstName[0] + post.author.lastName[0]
                            : post.author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-foreground">{post.author.firstName} {post.author.lastName}</h4>
                        <span className="text-sm text-muted-foreground">@{post.author.username}</span>
                        <span className="text-sm text-muted-foreground">·</span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.createdAt))} ago
                        </span>
                        {/* {post.author.userId === userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-500 ml-2"
                            disabled={deletingPostId === post._id}
                            onClick={() => handleDeletePost(post._id)}
                            title="Delete post"
                          >
                            {deletingPostId === post._id ? (
                              <Spinner />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        )} */}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <p className="text-foreground leading-relaxed">{post.content}</p>
                    {post.image && (
                      <img
                        src={post.image}
                        alt="Post content"
                        className="mt-3 rounded-lg max-w-full h-auto"
                      />
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post._id)}
                      className={`flex items-center space-x-2 ${post.isLiked ? "text-red-500" : "text-muted-foreground"}`}
                    >
                      <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
                      <span>{post.likesCount}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-muted-foreground transition-transform duration-300"
                      onClick={() => {
                        setActiveCommentPostId(prevId => (prevId === post._id ? null : post._id));
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{post.comments?.length || 0}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRepost(post._id)}
                      className={`flex items-center space-x-2 ${post.isReposted ? "text-green-500" : "text-muted-foreground"}`}
                    >
                      <Repeat2 className="h-4 w-4" />
                      <span>{post.repostsCount}</span>
                    </Button>

                  </div>

                  {/* Comment Form */}
                  {activeCommentPostId === post._id && (
                  <>
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="mt-4 flex space-x-2">
                      <Textarea name="comment" placeholder="Write a comment..." className="flex-1 resize-none" />
                      <Button type="submit" size="sm">
                        Post
                      </Button>
                    </form>
                    <div className="mt-4 space-y-3">
                      {(post.comments || []).map((comment) => (
                        <div key={comment._id} className="flex items-start space-x-3 ">
                          <Avatar>
                            {comment.author.profilePic ? (
                              <AvatarImage
                                src={comment.author.profilePic}
                                alt={comment.author.username}
                              />
                            ) : (
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {comment.author.username
                                  ? comment.author.username.charAt(0).toUpperCase()
                                  : "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-xs text-foreground">
                              <span className="font-semibold">{comment.author.username}</span> 
                            </p>
                            <p>
                              {comment.content}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.timestamp))} ago
                            </span>
                          </div>
                          <div>
                            {/* Show delete button only if current user is comment author */}
                            {comment.author.userId === userId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500"
                                disabled={deletingCommentId === comment._id}
                                onClick={() => handleDeleteComment(post._id, comment._id)}
                                title="Delete comment"
                              >
                                {deletingCommentId === comment._id ? (
                                  <Spinner />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Community;
