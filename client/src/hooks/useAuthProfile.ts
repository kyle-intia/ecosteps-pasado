import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../lib/api";

export const PROFILE = "userProfileDetails";

const useProfile = (opts = {}) => {
  const { data: user, ...rest } = useQuery({
    queryKey: [PROFILE],
    queryFn: getProfile,
    staleTime: Infinity,
    ...opts,
  });
  return {
    user,
    ...rest,
  };
};

export default useProfile;