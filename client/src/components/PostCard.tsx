// components/PostCard.tsx
import React, { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Heart, MessageCircle, Repeat2, Share2, Trash2, MoreHorizontal, Loader2, UserPlus, UserCheck
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  likePost, repostPost, sharePost, commentOnPost, deleteComment, deletePost, followUser, unfollowUser
} from "@/lib/api";
import { cn } from "@/lib/utils";

interface Author {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePic?: string;
}

interface Comment {
  _id: string;
  author: Author;
  authorProfile?: Author;
  content: string;
  timestamp?: string;
}

interface Post {
  _id: string;
  author: Author;
  authorProfile?: Author;
  content: string;
  image?: string;
  visibility: "public" | "private";
  likesCount?: number;
  repostsCount?: number;
  sharesCount?: number;
  comments?: Comment[];
  isLiked?: boolean;
  isReposted?: boolean;
  isFollowing?: boolean;
  createdAt: string;
}

interface PostCardProps {
  className?: string;
  post: Post;
  currentUserId: string | undefined;
  isFollowing: boolean;
  onLike: (postId: string) => Promise<void>;
  onRepost: (postId: string) => Promise<void>;
  onShare: (postId: string) => Promise<void>;
  onComment: (postId: string, content: string) => Promise<void>;
  onDeletePost: (postId: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => Promise<void>;
  onToggleFollow?: (userId: string, follow: boolean) => Promise<void>;
  onUpdatePost: (updatedPost: Post) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  className,
  post,
  currentUserId,
  isFollowing: initialIsFollowing,
  onLike,
  onRepost,
  onShare,
  onComment,
  onDeletePost,
  onDeleteComment,
  onToggleFollow,
  onUpdatePost,
}) => {
  const [activeComment, setActiveComment] = useState(false);
  const [confirmingDeletePost, setConfirmingDeletePost] = useState(false);
  const [confirmingDeleteComment, setConfirmingDeleteComment] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const isOwnPost = post.author._id === currentUserId;
  const isFollowing = initialIsFollowing ?? post.isFollowing ?? false;

  const handleLike = async () => {
    try {
      await onLike(post._id);
    } catch (err: any) {
      toast({ title: "Like failed", description: err.message || "Try again", variant: "destructive" });
    }
  };

  const handleRepost = async () => {
    try {
      await onRepost(post._id);
    } catch (err: any) {
      toast({ title: "Repost failed", description: err.message || "Try again", variant: "destructive" });
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await onShare(post._id);
      if (navigator.share) {
        await navigator.share({ title: "EcoStep post", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (err: any) {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("comment") as HTMLInputElement;
    const content = input.value.trim();
    if (!content) return;
    try {
      await onComment(post._id, content);
      input.value = "";
    } catch (err: any) {
      toast({ title: "Comment failed", variant: "destructive" });
    }
  };

  const handleDeletePost = async () => {
    setDeletingId(post._id);
    try {
      await onDeletePost(post._id);
    } finally {
      setDeletingId(null);
      setConfirmingDeletePost(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setDeletingId(commentId);
    try {
      await onDeleteComment(post._id, commentId);
    } finally {
      setDeletingId(null);
      setConfirmingDeleteComment(null);
    }
  };

  return (
    <Card 
      className={cn(
        "shadow-card border-border hover:shadow-elevated transition-smooth",
        className
      )}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={post.authorProfile?.profilePic} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {post.authorProfile?.firstName?.[0] || post.author.username?.[0]?.toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold">
                {post.authorProfile?.firstName && post.authorProfile?.lastName
                  ? `${post.authorProfile.firstName} ${post.authorProfile.lastName}`
                  : post.author.username}
                <span className="text-sm text-muted-foreground ml-2">@{post.authorProfile?.username}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {post.visibility === "private" ? "Private" : "Public"} · {formatDistanceToNow(new Date(post.createdAt))} ago
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isOwnPost && onToggleFollow && (
              isFollowing ? (
                <Button size="sm" variant="outline" onClick={() => onToggleFollow(post.author._id, false)}>
                  <UserCheck className="h-4 w-4 mr-1" /> Following
                </Button>
              ) : (
                <Button size="sm" onClick={() => onToggleFollow(post.author._id, true)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Follow
                </Button>
              )
            )}

            {isOwnPost && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                </PopoverTrigger>
                <PopoverContent className="w-fit p-2">
                  {confirmingDeletePost ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm">Delete this post?</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setConfirmingDeletePost(false)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={handleDeletePost} disabled={deletingId === post._id}>
                          {deletingId === post._id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setConfirmingDeletePost(true)}>
                      <Trash2 className="h-4 w-4 mr-2" /> Delete post
                    </Button>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.content}</p>
          {post.image && <img src={post.image} alt="Post" className="mt-4 rounded-lg max-w-full h-auto" />}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleLike} className={post.isLiked ? "text-red-500" : ""}>
              <Heart className={`h-4 w-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span className="ml-1">{post.likesCount ?? 0}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={() => setActiveComment(!activeComment)}>
              <MessageCircle className="h-4 w-4" />
              <span className="ml-1">{post.comments?.length ?? 0}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleRepost} className={post.isReposted ? "text-green-600" : ""}>
              <Repeat2 className="h-4 w-4" />
              <span className="ml-1">{post.repostsCount ?? 0}</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">{post.sharesCount ?? 0} shares</span>
        </div>

        {/* Comments Section */}
        {activeComment && (
          <div className="mt-6 space-y-4">
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <Textarea name="comment" placeholder="Write a comment..." className="resize-none" rows={2} />
              <Button type="submit" size="sm">Post</Button>
            </form>

            <div className="space-y-4">
              {(post.comments || []).map((comment) => (
                <div key={comment._id} className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={comment.authorProfile?.profilePic} />
                    <AvatarFallback>{comment.authorProfile?.username?.[0] || "?"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {comment.authorProfile?.firstName && comment.authorProfile?.lastName
                        ? `${comment.authorProfile.firstName} ${comment.authorProfile.lastName}`
                        : comment.authorProfile?.username}
                    </p>
                    <p className="text-sm mt-1">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(comment.timestamp || Date.now()))} ago
                    </p>
                  </div>

                  {comment.author._id === currentUserId && (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit p-2">
                        {confirmingDeleteComment === comment._id ? (
                          <div className="flex flex-col gap-2">
                            <p className="text-xs">Delete comment?</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => setConfirmingDeleteComment(null)}>Cancel</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteComment(comment._id)}>
                                Delete
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="text-red-500 text-left" onClick={() => setConfirmingDeleteComment(comment._id)}>
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        )}
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PostCard;