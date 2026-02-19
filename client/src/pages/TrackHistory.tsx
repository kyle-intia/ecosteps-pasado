import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Timer, Gauge, Activity, Calendar } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import { getActivityTrack } from "../lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/Navbar";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import { Spinner } from "@/components/ui/spinner";

type Category = "all" | "private" | "public" | "basic";

type Subtype =
  | "all"
  | "diesel"
  | "electric"
  | "gasoline"
  | "hybrid"
  | "motorcycle"
  | "tricycle"
  | "jeep"
  | "e-jeep"
  | "train"
  | "walk"
  | "bicycle";

interface ApiActivity {
  _id: string;
  category: Exclude<Category, "all">;
  subtype: Exclude<Subtype, "all">;
  totalDistance: number;
  duration: number;
  avgSpeed?: number;
  pace?: number;
  createdAt: string;
  points?: { latitude: number; longitude: number }[];
}

interface ActivityRecord {
  _id: string;
  category: Exclude<Category, "all">;
  subtype: Exclude<Subtype, "all">;
  distance: number;
  duration: number;
  speed?: number;
  pace?: number;
  timestamp: string;
  points: { latitude: number; longitude: number }[];
}

const transportTypes = {
  private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
  public: ["tricycle", "jeep", "e-jeep", "train"],
  basic: ["walk", "bicycle"],
};

function FitBounds({
  points,
}: {
  points: { latitude: number; longitude: number }[];
}) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = points.map(
        (p) => [p.latitude, p.longitude] as [number, number],
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

export default function UserTrackHistory() {
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();

  const [filters, setFilters] = useState<{
    category: Category;
    subType: Subtype;
  }>({
    category: "all",
    subType: "all",
  });

  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchActivities = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError("");

      try {
        const params: Record<string, string> = {};
        if (filters.category !== "all") params.category = filters.category;
        if (filters.subType !== "all") params.subtype = filters.subType;

        const dataFromApi: ApiActivity[] = await getActivityTrack({
          params,
          signal,
        });

        const normalizedData: ActivityRecord[] = dataFromApi.map((item) => ({
          _id: item._id,
          category: item.category,
          subtype: item.subtype,
          distance: item.totalDistance,
          duration: item.duration,
          speed: item.avgSpeed,
          pace: item.pace,
          timestamp: item.createdAt,
          points: item.points || [],
        }));

        setActivities(normalizedData);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Failed to fetch activities:", err.message || err);
          setError("⚠️ Failed to load activities. Please try again.");
          setActivities([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [filters],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => fetchActivities(controller.signal), 400);
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [fetchActivities]);

  const handleCategoryChange = (value: Category) => {
    setFilters({ category: value, subType: "all" });
  };

  const handleSubTypeChange = (value: Subtype) => {
    setFilters((prev) => ({ ...prev, subType: value }));
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "private":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "public":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "basic":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const availableSubtypes =
    filters.category === "all"
      ? []
      : transportTypes[filters.category as keyof typeof transportTypes];

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (filters.category !== "all" && activity.category !== filters.category)
        return false;
      if (filters.subType !== "all" && activity.subtype !== filters.subType)
        return false;
      return true;
    });
  }, [activities, filters]);

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Spinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div>
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight flex items-center gap-3">
            <Activity className="h-10 w-10 text-primary" />
            Track History
          </h1>
          <p className="text-muted-foreground text-base">
            Review and explore your recorded activities.
          </p>
        </header>

        <Card className="rounded-3xl shadow-sm border border-gray-200 my-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold">Filters</CardTitle>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row gap-6">
              <Select
                value={filters.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full sm:w-[220px] h-11 px-4 rounded-xl bg-muted/40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="basic">Basic</SelectItem>
                </SelectContent>
              </Select>

              {filters.category !== "all" && (
                <Select
                  value={filters.subType}
                  onValueChange={handleSubTypeChange}
                >
                  <SelectTrigger className="w-full sm:w-[220px] h-11 px-4 rounded-xl bg-muted/40">
                    <SelectValue placeholder="Subtype" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Types</SelectItem>
                    {availableSubtypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        {loading && (
          <Card className="rounded-3xl p-10 flex flex-col gap-6 border border-gray-200">
            <div className="flex flex-col gap-4 items-center">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-4 w-1/2 rounded" />
            </div>
            <p className="text-muted-foreground text-center">
              Loading activities…
            </p>
          </Card>
        )}

        {!loading && error && (
          <Card className="rounded-3xl p-10 text-center border border-red-300 bg-red-50">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchActivities(new AbortController().signal)}
              className="mt-4 px-5 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
            >
              Retry
            </button>
          </Card>
        )}

        {!loading && !error && filteredActivities.length === 0 && (
          <Card className="rounded-3xl p-14 text-center border border-gray-200">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-muted-foreground text-sm">
              Adjust your filters or record a new activity.
            </p>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredActivities.map((activity) => {
            const center: [number, number] =
              activity.points.length > 0
                ? [activity.points[0].latitude, activity.points[0].longitude]
                : [0, 0];

            return (
              <Card
                key={activity._id}
                className="rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition"
              >
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getCategoryColor(
                          activity.category,
                        )}`}
                      >
                        {activity.category.toUpperCase()}
                      </Badge>

                      <span className="text-lg font-semibold">
                        {activity.subtype.charAt(0).toUpperCase() +
                          activity.subtype.slice(1)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Distance
                        </p>
                        <p className="text-lg font-semibold">
                          {activity.distance.toFixed(2)} km
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Timer className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Duration
                        </p>
                        <p className="text-lg font-semibold">
                          {formatDuration(activity.duration)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {activity.points.length > 0 && (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                      <MapContainer
                        center={center}
                        zoom={15}
                        style={{ height: 420, width: "100%" }}
                      >
                        <TileLayer
                          url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`}
                          attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />

                        <Polyline
                          positions={activity.points.map((p) => [
                            p.latitude,
                            p.longitude,
                          ])}
                        />

                        <Marker position={center}>
                          <Popup>Start</Popup>
                        </Marker>

                        <Marker
                          position={[
                            activity.points[activity.points.length - 1]
                              .latitude,
                            activity.points[activity.points.length - 1]
                              .longitude,
                          ]}
                        >
                          <Popup>End</Popup>
                        </Marker>

                        <FitBounds points={activity.points} />
                      </MapContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
