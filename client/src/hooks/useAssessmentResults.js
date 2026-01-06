import { useQuery } from "@tanstack/react-query";
import { getAssessmentResults } from "../lib/api";

export const useAssessmentResults = (userId) => {
  return useQuery({
    queryKey: ["assessmentResults", userId], // key as array
    queryFn: async () => {
      const response = await getAssessmentResults(userId);
      if (!response.success) {
        throw new Error("Failed to fetch assessment results");
      }
      return response.result;
    },
    enabled: !!userId, // only fetch if userId exists
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export default useAssessmentResults;