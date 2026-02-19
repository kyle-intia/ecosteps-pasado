import { useQuery } from "@tanstack/react-query";
import { getAssessmentResults } from "../lib/api";

export const useAssessmentResults = (userId) => {
  return useQuery({
    queryKey: ["assessmentResults", userId],
    queryFn: async () => {
      const response = await getAssessmentResults(userId);
      if (!response.success) {
        throw new Error("Failed to fetch assessment results");
      }
      return response.result;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
};

export default useAssessmentResults;
