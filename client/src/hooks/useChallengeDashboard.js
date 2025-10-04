// client/src/hooks/useChallengeDashboard.js
import { useQuery } from "@tanstack/react-query";
import { getChallengeStats } from "../lib/challengeApi";
import useAuth from "./useAuth";

export const useChallengeStats = (days = 30) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["challenges", "stats", days],
    queryFn: () => getChallengeStats(days),
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export default useChallengeStats;