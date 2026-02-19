import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDashboardSummary,
  getDashboardTrends,
  regenerateRecommendations,
} from "../lib/api";
import useAuth from "./useAuth";

export const useDashboardData = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 10,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useMonthlyTrends = (months = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard", "trends", months],
    queryFn: () => getDashboardTrends(months),
    enabled: !!user,
    staleTime: 1000 * 60 * 10,
    cacheTime: 1000 * 60 * 15,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useRegenerateRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: regenerateRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => {
      console.error("Failed to regenerate recommendations:", error);
    },
  });
};

export default {
  useDashboardData,
  useMonthlyTrends,
  useRegenerateRecommendations,
};
