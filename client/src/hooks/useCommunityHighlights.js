import { useQuery } from "@tanstack/react-query";
import { getCommunityPosts } from "../lib/api";

export const COMMUNITY_HIGHLIGHTS = "communityHighlights";

const useCommunityHighlights = (limit = 5) => {
  const { data, ...rest } = useQuery({
    queryKey: [COMMUNITY_HIGHLIGHTS, limit],
    queryFn: () => getCommunityPosts(),
  });

  const highlights = data?.data
    ? data.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit)
        .map((post) => ({
          id: post.id,
          username: post.user?.username || "Anonymous",
          avatar: post.user?.profilePic || null,
          content: post.content,
          timestamp: new Date(post.createdAt),
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          isAchievement: post.isAchievement || false,
          achievementBadge: post.achievementBadge || null,
        }))
    : [];

  return {
    highlights,
    ...rest,
  };
};

export default useCommunityHighlights;
