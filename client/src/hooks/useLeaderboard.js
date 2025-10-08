import { useEffect, useState } from "react";
import { getUserLeaderboard } from "../lib/api";

export function useLeaderboard() {
  const [userLeaderboard, setUserLeaderboard] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setPending(true);
      setError(null);

      try {
        const data = await getUserLeaderboard();

        if (data.success && data.data) {
          const entry = data.data;

          const transformed = {
            id: entry.user.userId,
            avatarUrl: entry.user.profilePic,
            firstName: entry.user.firstName,
            lastName: entry.user.lastName,
            currentRank: entry.rank,
            tier: entry.tier,
            Posts: entry.Posts,
            Activity: entry.Activity,
            totalScore: entry.totalScore,
            equippedBadges: entry.user.equippedBadges || [],
          };

          setUserLeaderboard(transformed);
        } else {
          setUserLeaderboard(null);
          console.warn("Unexpected response format", data);
        }
      } catch (err) {
        setError(err);
        setUserLeaderboard(null);
      } finally {
        setPending(false); // ✅ Fix this
      }
    };

    fetchLeaderboard();
  }, []);

  return { userLeaderboard, pending, error };
}
