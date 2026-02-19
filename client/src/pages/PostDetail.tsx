import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCommunityPostById } from "@/lib/api";
import PostModal from "@/components/PostModal";
import useAuth from "@/hooks/useAuth";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { user, isPending: authLoading } = useAuth();
  const userId = (user as { _id?: string } | undefined)?._id;

  const {
    data: post,
    isLoading: postLoading,
    error,
  } = useQuery({
    queryKey: ["post", id],
    queryFn: () => getCommunityPostById(id!),
  });

  const isOwner = userId && post?.author?._id === userId;
  const isPublic = post?.visibility === "public";
  const canView = isPublic || isOwner;

  useEffect(() => {
    if (authLoading || postLoading) return;

    if (error) return;

    if (!post) return;

    if (post.visibility === "private") {
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      if (!isOwner) {
        navigate(-1);
        return;
      }
    }
  }, [authLoading, postLoading, user, post, isOwner, error, navigate]);

  if (postLoading || authLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading post</div>;
  if (!post) return <div>Post not found</div>;

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-xl">This post is private</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary">
          Go back
        </button>
      </div>
    );
  }

  return (
    <PostModal
      post={post}
      open={true}
      onOpenChange={(open) => !open && navigate(-1)}
      currentUserId={userId}
    />
  );
};

export default PostDetail;
