import { useQuery } from "@tanstack/react-query";
import { getUser } from "../lib/api";

export const AUTH = "auth";

const useAuth = (opts = {}) => {
  const useAuthFlag = import.meta.env.VITE_USE_AUTH === 'true';
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('authToken');

  // prod: only run the query when auth is enabled
  const { data: user, isLoading, error, ...rest } = useQuery({
    queryKey: [AUTH],
    queryFn: getUser,
    staleTime: Infinity,
    enabled: useAuthFlag && hasToken,
    retry: false,
    refetchOnWindowFocus: false,
    // allow consumers to override
    ...(opts as any),
  });

  if (!useAuthFlag) {
    // Dev: don't fetch user; return safe defaults
    return {
      user: null,
      isLoading: false,
      error: null,
      ...rest,
    } as const;
  }

  return {
    user: (user as any) ?? null,
    isLoading,
    error,
    ...rest,
  } as const;
};

export default useAuth;