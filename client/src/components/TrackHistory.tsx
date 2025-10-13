import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Timer, Activity, Calendar } from "lucide-react";
import { getActivityTrack } from "../lib/api";

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

interface ActivityRecord {
  _id: string;
  category: Exclude<Category, "all">;
  subtype: Exclude<Subtype, "all">;
  distance: number;
  duration: number;
  speed?: number;
  pace?: number;
  timestamp: string;
}

const transportTypes = {
  private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
  public: ["tricycle", "jeep", "e-jeep", "train"],
  basic: ["walk", "bicycle"],
};

export default function UserTrackHistory() {
  const [filters, setFilters] = useState<{ category: Category; subType: Subtype }>({
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

        const dataFromApi: any[] = await getActivityTrack({
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
    [filters]
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
    setFilters({
      category: value,
      subType: "all",
    });
  };

  const handleSubTypeChange = (value: Subtype) => {
    setFilters((prev) => ({
      ...prev,
      subType: value,
    }));
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  const filteredActivities = activities.filter((activity) => {
    if (filters.category !== "all" && activity.category !== filters.category) return false;
    if (filters.subType !== "all" && activity.subtype !== filters.subType) return false;
    return true;
  });

  const availableSubtypes =
    filters.category === "all" ? [] : transportTypes[filters.category as keyof typeof transportTypes];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Track History
          </h1>
          <p className="text-muted-foreground mt-1">View your past transportation activities</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filters.category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="private">PRIVATE</SelectItem>
                <SelectItem value="public">PUBLIC</SelectItem>
                <SelectItem value="basic">BASIC</SelectItem>
              </SelectContent>
            </Select>

            {filters.category !== "all" && (
              <Select value={filters.subType} onValueChange={handleSubTypeChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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

      {loading ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-4">Loading activities...</p>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6 text-center py-12 text-red-600">
            <p>{error}</p>
            <button
              onClick={() => {
                const controller = new AbortController();
                fetchActivities(controller.signal);
              }}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      ) : filteredActivities.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No activities found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or start tracking a new activity
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredActivities.map((activity) => (
            <Card key={activity._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(activity.category)}>
                        {activity.category.toUpperCase()}
                      </Badge>
                      <span className="font-semibold text-lg">
                        {activity.subtype.charAt(0).toUpperCase() + activity.subtype.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {formatDate(activity.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distance</p>
                      <p className="font-semibold">{activity.distance} km</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-semibold">{formatDuration(activity.duration)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
