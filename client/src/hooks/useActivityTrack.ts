import { useQuery } from "@tanstack/react-query";
import { getActivityTrack } from "../lib/api"; // Assuming this is the API function to fetch the data

export const ACTIVITY_TRACK = "activityTrack";

// Define the shape of the data returned from the API
interface Point {
  latitude: number;
  longitude: number;
  timestamp: string;
  _id: string;
}

export interface ActivityData {
  _id: string;
  userId: string;
  category: string;
  subtype: string;
  points: Point[];
  totalDistance: number;
  duration: number;
  avgSpeed?: number;
  pace?: number;
  createdAt: string;
  updatedAt: string;
}

const useActivityTrack = (opts: { enabled?: boolean } = {}) => {
  const { enabled = true } = opts;

  const queryKey = [ACTIVITY_TRACK];

  const queryFn = () => getActivityTrack({ params: {} });  // No filters, get all activities

  const { data, error, isLoading, isError, refetch } = useQuery<ActivityData[]>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // Cache the data for 5 minutes
    enabled, // You can control whether the query runs
  });

  return {
    activities: data || [],
    error,
    isLoading,
    isError,
    refetch,
  };
};

export default useActivityTrack;
