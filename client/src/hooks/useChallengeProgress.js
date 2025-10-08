import { useQuery } from "@tanstack/react-query";
import { getChallengeStats, getTodaysChallenges } from "../lib/api";

export const CHALLENGE_PROGRESS = "challengeProgress";

const useChallengeProgress = () => {
  const { data: statsData, ...statsRest } = useQuery({
    queryKey: ["challengeStats", 7],
    queryFn: () => getChallengeStats(7),
  });

  const { data: todaysData, ...todaysRest } = useQuery({
    queryKey: ["todaysChallenges"],
    queryFn: () => getTodaysChallenges(),
  });

  // Calculate weekly progress
  let weeklyCompleted = 0;
  let weeklyTotal = 0;
  let perfectDays = 0;

  if (statsData?.data) {
    // Assuming statsData.data has weekly stats
    // This might need adjustment based on actual API response
    weeklyCompleted = statsData.data.completedChallenges || 0;
    weeklyTotal = statsData.data.totalChallenges || 21; // 3 challenges * 7 days
    perfectDays = statsData.data.perfectDays || 0;
  }

  const completionPercentage = weeklyTotal > 0 ? (weeklyCompleted / weeklyTotal) * 100 : 0;

  // Today's challenges
  const todaysChallenges = todaysData?.data?.challenges || [];
  const todaysCompleted = todaysChallenges.filter(c => c.completed).length;
  const todaysTotal = todaysChallenges.length;

  return {
    weeklyProgress: {
      completed: weeklyCompleted,
      total: weeklyTotal,
      percentage: completionPercentage,
      perfectDays
    },
    todaysProgress: {
      completed: todaysCompleted,
      total: todaysTotal
    },
    isLoading: statsRest.isLoading || todaysRest.isLoading,
    isError: statsRest.isError || todaysRest.isError,
    error: statsRest.error || todaysRest.error,
    refetch: () => {
      statsRest.refetch();
      todaysRest.refetch();
    }
  };
};

export default useChallengeProgress;
