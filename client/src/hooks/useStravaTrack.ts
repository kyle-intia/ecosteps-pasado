import { useEffect, useState } from "react";

export default function useStravaTrack() {
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

  const checkConnection = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/strava/status`, {
        credentials: "include",
      });
      const data = await res.json();
      setIsConnected(data.connected);
      return data.connected;
    } catch {
      setIsConnected(false);
    }
  };

  const fetchStravaActivities = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/strava/activities`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch Strava activities");
      const data = await res.json();
      setActivities(data.activities || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const connected = await checkConnection();
      if (connected) await fetchStravaActivities();
    })();
  }, []);

  return { activities, isLoading, error, isConnected, refetch: fetchStravaActivities };
}
