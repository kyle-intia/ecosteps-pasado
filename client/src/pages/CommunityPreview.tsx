import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const API = "http://localhost:8080/api/community";

interface Post {
  _id: string;
  author: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    profilePic?: string;
  };
  content: string;
  image?: string;
  likes: string[];
  reposts: string[];
  shares: string[];
  comments: any[];
  isLiked?: boolean;
  isReposted?: boolean;
  isShared?: boolean;
}

export default function SharedPostPreview() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");

  const fetchPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/user/post/${postId}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to load post");
      const data = await res.json();
      setPost(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Failed to load post",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const handleAction = async (action: "like" | "repost" | "share") => {
    if (!post) return;
    try {
      const res = await fetch(`${API}/posts/${post._id}/${action}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${action} failed`);
      const updatedPost = await res.json();
      setPost(updatedPost);
    } catch (err) {
      console.error(err);
      toast({
        title: `${action} failed`,
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || !post) return;
    try {
      const res = await fetch(`${API}/posts/${post._id}/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) throw new Error("Comment failed");
      const updatedPost = await res.json();
      setPost(updatedPost);
      setCommentText("");
    } catch (err) {
      console.error(err);
      toast({
        title: "Comment failed",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!post) return <div>Post not found.</div>;

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-lg shadow-md">
      <h3 className="font-semibold">
        {post.author.firstName} {post.author.lastName} (@{post.author.username})
      </h3>
      <p className="mt-2">{post.content}</p>
      {post.image && (
        <img
          src={post.image}
          alt="Post"
          className="mt-4 rounded-md max-w-full"
        />
      )}
      <div className="mt-4 flex gap-4">
        <span>Likes: {post.likes.length}</span>
        <span>Reposts: {post.reposts.length}</span>
        <span>Shares: {post.shares.length}</span>
      </div>
    </div>
  );
}
