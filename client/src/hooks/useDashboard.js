// client/src/hooks/useDashboard.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDashboardSummary, getDashboardTrends, regenerateRecommendations } from "../lib/api";
import useAuth from "./useAuth";

export const useDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export const useMonthlyTrends = (months = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "trends", months],
    queryFn: () => getDashboardTrends(months),
    enabled: !!user, // Only run query if user is authenticated
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

// Hook for regenerating recommendations
export const useRegenerateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateRecommendations,
    onSuccess: () => {
      // Invalidate and refetch dashboard data to get new recommendations
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      console.error('Failed to regenerate recommendations:', error);
    }
  });
};

export default {
  useDashboardData,
  useMonthlyTrends,
  useRegenerateRecommendations
};
