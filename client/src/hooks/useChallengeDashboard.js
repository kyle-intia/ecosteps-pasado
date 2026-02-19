import { useQuery } from "@tanstack/react-query";
import { getChallengeStats } from "../lib/challengeApi";
import useAuth from "./useAuth";

export const useChallengeStats = (days = 30) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["challenges", "stats", days],
    queryFn: () => getChallengeStats(days),
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default useChallengeStats;
