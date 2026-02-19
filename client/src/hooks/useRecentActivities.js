import { useQuery } from "@tanstack/react-query";
import {
  getDailyTrackingHistory,
  getChallengeHistory,
  getUserCommunityPosts,
} from "../lib/api";

export const RECENT_ACTIVITIES = "recentActivities";

const useRecentActivities = (limit = 10) => {
  const { data: trackingData, ...trackingRest } = useQuery({
    queryKey: ["dailyTrackingHistory", limit],
    queryFn: () => getDailyTrackingHistory(limit, 0),
  });

  const { data: challengeData, ...challengeRest } = useQuery({
    queryKey: ["challengeHistory", limit],
    queryFn: () => getChallengeHistory(limit, 0),
  });

  const { data: postsData, ...postsRest } = useQuery({
    queryKey: ["userCommunityPosts", limit],
    queryFn: () => getUserCommunityPosts(),
  });

  const activities = [];

  if (trackingData?.data?.entries && Array.isArray(trackingData.data.entries)) {
    trackingData.data.entries.forEach((entry) => {
      activities.push({
        type: "tracking",
        id: `tracking-${entry.id}`,
        title: "Daily carbon footprint tracked",
        description: `${entry.footprint?.total || entry.footprint || 0} kg CO2 tracked`,
        timestamp: new Date(entry.createdAt),
        icon: "Activity",
        color: "success",
      });
    });
  }

  if (
    challengeData?.data?.history &&
    Array.isArray(challengeData.data.history)
  ) {
    challengeData.data.history.forEach((day) => {
      if (day.challenges && Array.isArray(day.challenges)) {
        day.challenges
          .filter((c) => c.completed)
          .forEach((challenge) => {
            activities.push({
              type: "challenge",
              id: `challenge-${day.id}-${challenge.id}`,
              title: "Completed eco-challenge",
              description: challenge.title || "Challenge completed",
              timestamp: new Date(challenge.completedAt),
              icon: "Target",
              color: "primary",
            });
          });
      }
    });
  }

  if (postsData && Array.isArray(postsData)) {
    postsData.slice(0, limit).forEach((post) => {
      activities.push({
        type: "post",
        id: `post-${post._id || post.id}`,
        title: "Shared community post",
        description: post.content
          ? post.content.substring(0, 50) +
            (post.content.length > 50 ? "..." : "")
          : "Shared a post",
        timestamp: new Date(post.createdAt),
        icon: "MessageSquare",
        color: "accent",
      });
    });
  }

  activities.sort((a, b) => b.timestamp - a.timestamp);

  const recentActivities = activities.slice(0, limit);

  return {
    activities: recentActivities,
    isLoading:
      trackingRest.isLoading || challengeRest.isLoading || postsRest.isLoading,
    isError: trackingRest.isError || challengeRest.isError || postsRest.isError,
    error: trackingRest.error || challengeRest.error || postsRest.error,
    refetch: () => {
      trackingRest.refetch();
      challengeRest.refetch();
      postsRest.refetch();
    },
  };
};

export default useRecentActivities;
