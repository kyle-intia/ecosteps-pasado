import { useQuery } from "@tanstack/react-query";
import { getActivityTrack } from "../lib/api";

export const ACTIVITY_TRACK = "activityTrack";

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
  isImported: boolean;
  createdAt: string;
  updatedAt: string;
}

const useActivityTrack = (opts: { enabled?: boolean } = {}) => {
  const { enabled = true } = opts;

  const queryKey = [ACTIVITY_TRACK, { isImported: false }];

  const queryFn = () => getActivityTrack({ params: {} }); // fetch all (filter client-side)

  const { data, error, isLoading, isError, refetch } = useQuery<ActivityData[]>({
    queryKey,
    queryFn,
    select: (activities) => activities.filter((a) => !a.isImported),
    staleTime: 1000 * 60 * 5,
    enabled,
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
