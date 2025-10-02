import { useQuery } from "@tanstack/react-query";
import { getSessions } from "../lib/api";
import useAuth from "./useAuth";

export const SESSIONS = "sessions";

export const useSessions = (opts = {}) => {
  const { user } = useAuth();

  const { data: sessions = [], ...rest } = useQuery({
    queryKey: [SESSIONS],
    queryFn: getSessions,
    enabled: !!user, // Only run query if user is authenticated
    ...opts,
  });

  return { sessions, ...rest };
};

export default useSessions;