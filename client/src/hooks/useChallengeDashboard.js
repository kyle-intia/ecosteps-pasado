// client/src/hooks/useChallengeDashboard.js
import { useQuery } from "@tanstack/react-query";
import { getChallengeStats } from "../lib/challengeApi";

export const useChallengeStats = (days = 30) => {
  return useQuery({
    queryKey: ["challenges", "stats", days],
    queryFn: () => getChallengeStats(days),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export default useChallengeStats;