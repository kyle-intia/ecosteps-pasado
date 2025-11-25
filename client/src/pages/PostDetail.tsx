import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCommunityPostById } from "@/lib/api";
import PostModal from "@/components/PostModal";
import useAuth from "@/hooks/useAuth";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Must include loading state to avoid early redirects
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

  // Determine owner & view permissions safely
  const isOwner = userId && post?.author?._id === userId;
  const isPublic = post?.visibility === "public";
  const canView = isPublic || isOwner;

  useEffect(() => {
    // ⛔ Do not run access logic while loading
    if (authLoading || postLoading) return;

    // If backend returned 404 or error → don't redirect incorrectly
    if (error) return;

    if (!post) return; // no data yet

    // PRIVATE POST ACCESS CONTROL
    if (post.visibility === "private") {
      // Not logged in → must login to view private post
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }

      // Logged in but not the owner → block
      if (!isOwner) {
        navigate(-1);
        return;
      }
    }
  }, [
    authLoading,
    postLoading,
    user,
    post,
    isOwner,
    error,
    navigate,
  ]);

  // UI States
  if (postLoading || authLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading post</div>;
  if (!post) return <div>Post not found</div>;

  // Unauthorized private view (fallback)
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
