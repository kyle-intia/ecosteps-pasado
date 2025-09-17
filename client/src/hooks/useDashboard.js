// client/src/hooks/useDashboard.js
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getDashboardTrends } from "../lib/api";

export const useDashboardData = () => {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export const useMonthlyTrends = (months = 6) => {
  return useQuery({
    queryKey: ["dashboard", "trends", months],
    queryFn: () => getDashboardTrends(months),
    staleTime: 1000 * 60 * 10, // 10 minutes
    cacheTime: 1000 * 60 * 15, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false
  });
};

export default {
  useDashboardData,
  useMonthlyTrends
};