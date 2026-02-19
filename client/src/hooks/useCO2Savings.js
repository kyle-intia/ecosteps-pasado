import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary, getDailyTrackingStats } from "../lib/api";

export const CO2_SAVINGS = "co2Savings";

const useCO2Savings = () => {
  const { data: summaryData, ...summaryRest } = useQuery({
    queryKey: ["dashboardSummary"],
    queryFn: () => getDashboardSummary(),
  });

  const { data: statsData, ...statsRest } = useQuery({
    queryKey: ["dailyTrackingStats", 1],
    queryFn: () => getDailyTrackingStats(1),
  });

  let todaysSavings = 0;
  let weeklySavings = 0;
  let totalSavings = 0;

  if (summaryData?.data) {
    todaysSavings = summaryData.data.todaysCO2Saved || 0;
    weeklySavings = summaryData.data.weeklyCO2Saved || 0;
    totalSavings = summaryData.data.totalCO2Saved || 0;
  } else if (statsData?.data) {
    todaysSavings = statsData.data.todaysEmissionSaved || 0;
    weeklySavings = statsData.data.weeklyEmissionSaved || 0;
    totalSavings = statsData.data.totalEmissionSaved || 0;
  }

  return {
    todaysSavings,
    weeklySavings,
    totalSavings,
    isLoading: summaryRest.isLoading || statsRest.isLoading,
    isError: summaryRest.isError || statsRest.isError,
    error: summaryRest.error || statsRest.error,
    refetch: () => {
      summaryRest.refetch();
      statsRest.refetch();
    },
  };
};

export default useCO2Savings;
