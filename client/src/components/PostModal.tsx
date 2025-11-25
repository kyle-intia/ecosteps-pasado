// src/components/PostModal.tsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import PostCard from "./PostCard";
import { useToast } from "@/hooks/use-toast";
import { likePost, repostPost, sharePost, deletePost, commentOnPost, deleteComment } from "@/lib/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

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
  likes?: string[];
  reposts?: string[];
  shares?: string[];
  isLiked?: boolean;
  isReposted?: boolean;
  isFollowing?: boolean;
  createdAt: string;
}


interface PostModalProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId?: string | null;
  isFollowing?: boolean;
  onToggleFollow?: (userId: string, follow: boolean) => Promise<void>;
}

const PostModal: React.FC<PostModalProps> = ({
  post,
  open,
  onOpenChange,
  currentUserId,
  isFollowing = false,
  onToggleFollow,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
    const navigate = useNavigate();

  // Handlers that update both backend and UI optimistically/invalidate cache
  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      toast({ title: "Sign in to like", variant: "destructive" });
      return;
    }
    await likePost(postId);
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
    queryClient.invalidateQueries({ queryKey: ["posts"] }); // if you have feeds
  };

  const handleRepost = async (postId: string) => {
    if (!currentUserId) {
      toast({ title: "Sign in to repost", variant: "destructive" });
      return;
    }
    await repostPost(postId);
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  };

  const handleShare = async (postId: string) => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });

    if (currentUserId) {
      try {
        await sharePost(postId);
      } catch (err) {
        console.error("Failed to record share", err);
      }
    }
  };

const commentMutation = useMutation({
  mutationFn: ({ postId, content }: { postId: string; content: string }) =>
    commentOnPost(postId, content),

  onMutate: async ({ postId, content }) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["post", postId] });

    // Snapshot previous post
    const previousPost = queryClient.getQueryData(["post", postId]);

    // Optimistically update
    queryClient.setQueryData(["post", postId], (old: any) => {
      if (!old) return old;

      const newComment = {
        _id: Date.now().toString(), // temporary ID
        content,
        author: {
          _id: currentUserId,
          // You can also fetch current user profile here if needed
        },
        authorProfile: {
          firstName: "You",
          username: "you",
        },
        timestamp: new Date().toISOString(),
      };

      return {
        ...old,
        comments: [...(old.comments || []), newComment],
      };
    });

    return { previousPost };
  },

  onError: (err, { postId }, context) => {
    // Rollback on error
    queryClient.setQueryData(["post", postId], context?.previousPost);
    toast({
      title: "Failed to post comment",
      description: "Please try again",
      variant: "destructive",
    });
  },

  onSettled: (data, error, variables) => {
    queryClient.invalidateQueries({ queryKey: ["post", variables.postId] });
    queryClient.invalidateQueries({ queryKey: ["posts"] }); // if you have feeds
  },

  onSuccess: () => {
    toast({ title: "Comment posted!" });
  },
});

const handleComment = async (postId: string, content: string) => {
  if (!content.trim()) return;
  commentMutation.mutate({ postId, content });
};

const handleDeletePost = async (postId: string) => {
  if (!currentUserId) {
    toast({ title: "Sign in to delete posts", variant: "destructive" });
    return;
  }
    try {
        await deletePost(postId);
        toast({ title: "Post deleted" });
        navigate(-1);
    } catch (err) {
        toast({ title: "Failed to delete post", variant: "destructive" });
    }
};
const handleDeleteComment = async (postId: string, commentId: string) => {
  if (!currentUserId) {
    toast({ title: "Sign in to delete comments", variant: "destructive" });
    return;
  }
    try {
        await deleteComment(postId, commentId);
        toast({ title: "Comment deleted" });
        queryClient.invalidateQueries({ queryKey: ["post", postId] });
    } catch (err) {
        toast({ title: "Failed to delete comment", variant: "destructive" });
    }
};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full h-[90vh] p-0 overflow-hidden bg-background rounded-2xl flex flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <PostCard
            className="bg-transparent shadow-none hover:shadow-none"
            post={{
              ...post,
              isLiked: currentUserId ? post.likes?.includes(currentUserId) : false,
              isReposted: currentUserId ? post.reposts?.includes(currentUserId) : false,
              isFollowing,
              comments: post.comments || [],
              likesCount: post.likesCount ?? post.likes?.length ?? 0,
              repostsCount: post.repostsCount ?? post.reposts?.length ?? 0,
            }}
            currentUserId={currentUserId || undefined}
            isFollowing={isFollowing}
            onLike={handleLike}
            onRepost={handleRepost}
            onShare={handleShare}
            onComment={handleComment}
            onDeletePost={handleDeletePost}
            onDeleteComment={handleDeleteComment}
            onToggleFollow={onToggleFollow}
            onUpdatePost={(updatedPost) => {
              queryClient.setQueryData(["post", post._id], updatedPost);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostModal;