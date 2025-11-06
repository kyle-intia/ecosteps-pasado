// client/src/pages/TrackCarbon.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Leaf, Car, Utensils, Calendar, Calculator, Sparkles, Receipt, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import queryClient from "../config/queryClient";
import useSessions from "../hooks/useSessions";
import useAuth from "../hooks/useAuth";
import RecommendationView from "../components/RecommendationView";
import LoadingSpinner from "../components/LoadingSpinner";
import useActivityTrack from "@/hooks/useActivityTrack";
import { logout, getTodaysTracking, getDailyTrackingHistory } from "../lib/api";

/**
 * Emission factors for quick local estimates (kg CO2e per km or per serving)
 * These are the same as in your copy file and are used to show per-entry CO2e locally.
 */
const EMISSION_FACTORS: Record<string, number> = {
  diesel: 0.171,
  electric: 0.047,
  gasoline: 0.192,
  hybrid: 0.109,
  motorcycle: 0.103,
  tricycle: 0.089,
  jeep: 0.112,
  "e-jeep": 0.051,
  train: 0.041,
  walk: 0,
  bicycle: 0,
  // Food
  meat: 7.2,
  fish: 5.1,
  dairy: 3.2,
  mixed: 2.8,
  skipped: 0,
};

type EntryType = "distance" | "food";

interface TrackEntry {
  id: string;
  type: EntryType;
  category?: string; // private/public/basic or undefined for food
  subtype: string; // diesel, jeep, meat, fish, etc.
  value: number; // km or servings
  co2e?: number; // computed locally
  timestamp: string;
}

interface Receipt {
  id: string;
  date: string;
  entries: TrackEntry[];
  totalCO2e: number;
}

export default function TrackCarbon() {
  // auth / sessions
  const { toast } = useToast();
  const navigate = useNavigate();
  const { sessions, isPending, isError } = useSessions();
  const { user } = useAuth() as { user: { _id?: string } };

  // state for blended UI
  const [entries, setEntries] = useState<TrackEntry[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("distance");

  // distance form states
  const [distanceMode, setDistanceMode] = useState<"tracked" | "manual">("tracked");
  const [selectedTrackedIds, setSelectedTrackedIds] = useState<string[]>([]);
  const [distanceCategory, setDistanceCategory] = useState("private");
  const [distanceSubtype, setDistanceSubtype] = useState("diesel");
  const [distance, setDistance] = useState("");

  // food form states
  const [foodType, setFoodType] = useState("meat");
  const [foodName, setFoodName] = useState("");

  // activity tracking hook (if available)
  const { activities, isLoading: activitiesLoading, isError: activitiesError, error: activitiesErrorObj, refetch: refetchActivities } = useActivityTrack();

  // local UI flags
  const [loadingStatus, setLoadingStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [footprintData, setFootprintData] = useState<any | null>(null); // saved response data from /api/footprint/submit
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isFetchingRecommendations, setIsFetchingRecommendations] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [todayEntry, setTodayEntry] = useState<any | null>(null);
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

  // tracked activities mock fallback (if hook returns none)
  const trackedActivitiesFallback = [
    { id: "t1", category: "private", subtype: "diesel", distance: 12, timestamp: new Date().toISOString()},
    { id: "t2", category: "public", subtype: "jeep", distance: 8.5, timestamp: new Date(Date.now()-3600000).toISOString()},
    { id: "t3", category: "basic", subtype: "bicycle", distance: 5.2, timestamp: new Date(Date.now()-7200000).toISOString()},
  ];
  const trackedActivities = (activities && activities.length > 0) ? activities.map((a: any) => ({ id: a._id || a.id, category: a.category || a.type || "private", subtype: a.subtype, distance: a.totalDistance || a.distance || 0, timestamp: a.createdAt || a.timestamp || new Date().toISOString() })) : trackedActivitiesFallback;

  const transportTypes: Record<string, string[]> = {
    private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
    public: ["tricycle", "jeep", "e-jeep", "train"],
    basic: ["walk", "bicycle"],
  };

  // Rehydrate saved session footprint/recommendations if present
  useEffect(() => {
    const sessionFootprintId = localStorage.getItem('current_footprint_id');
    const sessionFootprintData = localStorage.getItem('current_footprint_data');
    const sessionRecommendations = localStorage.getItem('current_recommendations');

    if (sessionFootprintData) {
      try {
        const parsed = JSON.parse(sessionFootprintData);
        setFootprintData(parsed);
        setIsFetchingRecommendations(false);
        setLoadingStatus('success');
      } catch (e) {
        localStorage.removeItem('current_footprint_data');
        localStorage.removeItem('current_footprint_id');
        localStorage.removeItem('current_recommendations');
      }
    }
    if (sessionRecommendations) {
      try {
        const parsed = JSON.parse(sessionRecommendations);
        setRecommendations(parsed);
      } catch (e) {
        localStorage.removeItem('current_recommendations');
      }
    }
  }, []);

  // Sessions & auth redirect logic (kept from original)
  useEffect(() => {
    if (!isPending && sessions.length > 0) {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      // keep isLoggedIn state if you have a local state for it (we rely on Navbar prop below)
      // setIsLoggedIn(loggedIn) // not used here
    }

    if (!isPending && (isError || sessions.length === 0)) {
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    }
  }, [isPending, isError, sessions, navigate]);

  // fetch today's entry & history on mount (kept from original)
  useEffect(() => {
    const fetchToday = async () => {
      try {
        setIsLoadingToday(true);
        const res = await getTodaysTracking();
        setTodayEntry(res?.data || null);
      } catch (_e) {
        setTodayEntry(null);
      } finally {
        setIsLoadingToday(false);
      }
    };
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const res = await getDailyTrackingHistory(7, 0);
        setHistoryEntries(res?.data?.entries || []);
      } catch (_e) {
        setHistoryEntries([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchToday();
    fetchHistory();
  }, []);

  // logout mutation (kept from original)
  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  });

  const handleSignOut = () => signOut();

  // Helper: compute local co2e for an entry
  const computeEntryCO2e = (entry: TrackEntry) => {
    const factor = EMISSION_FACTORS[entry.subtype] ?? 0;
    return +(entry.value * factor);
  };

  // Add entry handler (from copy)
  const handleAddEntry = () => {
    if (entryType === "distance") {
      if (distanceMode === "tracked") {
        if (selectedTrackedIds.length === 0) {
          toast({
            title: "Please select at least one tracked activity",
            variant: "destructive"
          });
          return;
        }

        const newEntries = selectedTrackedIds.map(id => {
          const tracked = trackedActivities.find((t: any) => t.id === id)!;
          const e: TrackEntry = {
            id: Date.now().toString() + id,
            type: "distance",
            category: tracked.category,
            subtype: tracked.subtype,
            value: tracked.distance,
            timestamp: tracked.timestamp,
            co2e: +(tracked.distance * (EMISSION_FACTORS[tracked.subtype] ?? 0)),
          };
          return e;
        });

        setEntries(prev => [...newEntries, ...prev]);
        setSelectedTrackedIds([]);
        toast({ title: `${newEntries.length} tracked ${newEntries.length === 1 ? 'activity' : 'activities'} added!` });
      } else {
        const distanceValue = parseFloat(distance);
        if (!distanceValue || distanceValue <= 0) {
          toast({ title: "Please enter a valid distance", variant: "destructive" });
          return;
        }

        const newEntry: TrackEntry = {
          id: Date.now().toString(),
          type: "distance",
          category: distanceCategory,
          subtype: distanceSubtype,
          value: distanceValue,
          timestamp: new Date().toISOString(),
          co2e: +(distanceValue * (EMISSION_FACTORS[distanceSubtype] ?? 0)),
        };

        setEntries(prev => [newEntry, ...prev]);
        toast({ title: "Distance entry added!" });
      }
    } else {
      if (!foodName.trim()) {
        toast({ title: "Please enter the food name", variant: "destructive" });
        return;
      }

      const newEntry: TrackEntry = {
        id: Date.now().toString(),
        type: "food",
        subtype: foodType,
        value: 1,
        timestamp: new Date().toISOString(),
        co2e: +(1 * (EMISSION_FACTORS[foodType] ?? 0)),
      };

      setEntries(prev => [newEntry, ...prev]);
      toast({ title: "Food entry added!" });
    }

    // reset dialog fields
    setDialogOpen(false);
    setDistance("");
    setFoodName("");
    // don't auto-show recommendations (user requested manual trigger)
  };

  // Format date helper
  const formatDate = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString();
  };

  const getEntryIcon = (entry: TrackEntry) => entry.type === 'distance' ? <Car className="h-4 w-4" /> : <Utensils className="h-4 w-4" />;

  // BUILD PAYLOAD: preserve original payload structure from your earlier file
  // We group distances into modes[] and distances map; flightsToday default 'none'; homeEnergy placeholders; food aggregated
  const buildPayloadFromEntries = (entriesList: TrackEntry[]) => {
    // transport: group by backend ids used previously: car, public_transport, motorcycle, bicycle, walking, no_travel
    const modes: Array<{ id: string; distance?: number }> = [];
    const distances: Record<string, number> = {};

    // Keep totals per backend id
    let carTotal = 0;
    let publicTransportTotal = 0;
    let motorcycleTotal = 0;
    let bicycleTotal = 0;
    let walkingTotal = 0;

    // food aggregation counts by subtype
    const foodCounts: Record<string, number> = {};

    for (const e of entriesList) {
      if (e.type === 'distance') {
        // map subtypes to backend ids
        const subtype = e.subtype;
        const val = Number(e.value || 0) || 0;
        if (['diesel', 'electric', 'gasoline', 'hybrid'].includes(subtype)) {
          carTotal += val;
        } else if (['jeep', 'tricycle', 'e-jeep', 'train'].includes(subtype)) {
          publicTransportTotal += val;
        } else if (subtype === 'motorcycle') {
          motorcycleTotal += val;
        } else if (subtype === 'bicycle') {
          bicycleTotal += val;
        } else if (subtype === 'walk') {
          walkingTotal += val;
        } else {
          // fallback to carTotal if unknown
          carTotal += val;
        }
      } else if (e.type === 'food') {
        foodCounts[e.subtype] = (foodCounts[e.subtype] || 0) + (e.value || 1);
      }
    }

    if (carTotal > 0) {
      modes.push({ id: 'car', distance: +carTotal });
      distances['car'] = +carTotal;
    }
    if (publicTransportTotal > 0) {
      modes.push({ id: 'public_transport', distance: +publicTransportTotal });
      distances['public_transport'] = +publicTransportTotal;
    }
    if (motorcycleTotal > 0) {
      modes.push({ id: 'motorcycle', distance: +motorcycleTotal });
      distances['motorcycle'] = +motorcycleTotal;
    }
    if (bicycleTotal > 0) {
      modes.push({ id: 'bicycle', distance: +bicycleTotal });
      distances['bicycle'] = +bicycleTotal;
    }
    if (walkingTotal > 0) {
      modes.push({ id: 'walking', distance: +walkingTotal });
      distances['walking'] = +walkingTotal;
    }

    // If no transport modes present, send no_travel mode
    if (modes.length === 0) {
      modes.push({ id: 'no_travel' });
    }

    // Build a "food" object that matches prior shape, but we only have aggregated counts.
    // To preserve compatibility, we'll set breakfast/lunch/dinner to 'mixed' if there is any food entry,
    // and place a JSON-string summary into breakfastFood/lunchFood/dinnerFood fields.
    const hasFood = Object.keys(foodCounts).length > 0;
    const foodSummaryString = JSON.stringify(foodCounts);

    const food = {
      breakfast: hasFood ? 'mixed' : 'skipped',
      lunch: hasFood ? 'mixed' : 'skipped',
      dinner: hasFood ? 'mixed' : 'skipped',
      breakfastFood: foodSummaryString,
      lunchFood: foodSummaryString,
      dinnerFood: foodSummaryString,
    };

    // homeEnergy placeholders (since the activity UI doesn't collect them)
    const homeEnergy = {
      homeType: 'apartment',
      occupants: 1,
      appliances: ['none'],
    };

    const payload = {
      transport: { modes, distances },
      flightsToday: 'none',
      homeEnergy,
      food,
    };

    return payload;
  };

  // Send footprint to backend
  const submitFootprint = async (payload: any) => {
    const url = `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/footprint/submit`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to submit footprint' }));
      throw new Error(err?.message || 'Failed to submit footprint');
    }

    return response.json();
  };

  // Fetch recommendations from backend
  const fetchRecommendations = async (footprintId: string) => {
    const url = `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/recommendations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ footprintId }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to fetch recommendations' }));
      throw new Error(err?.message || 'Failed to fetch recommendations');
    }

    return response.json();
  };

  // Reset daily data endpoint
  const resetDailyData = async (): Promise<void> => {
    const url = `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/footprint/reset-daily`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ message: 'Failed to reset daily data' }));
      throw new Error(err?.message || 'Failed to reset daily data');
    }
  };

  // Handler: Calculate CO2 locally, then submit to backend (preserve original payload)
  const handleCalculateFootprint = async () => {
    if (entries.length === 0) {
      toast({ title: "No entries to calculate", variant: "destructive" });
      return;
    }

    try {
      setLoadingStatus('loading');
      setErrorMessage(null);

      // compute local per-entry co2e (if not computed yet)
      const updatedEntries = entries.map(e => ({ ...e, co2e: computeEntryCO2e(e) }));
      // Build receipt and show locally
      const totalCO2e = updatedEntries.reduce((s, it) => s + (it.co2e || 0), 0);
      const newReceipt: Receipt = { id: Date.now().toString(), date: new Date().toISOString(), entries: updatedEntries, totalCO2e };
      setReceipts(prev => [newReceipt, ...prev]);
      setEntries([]); // clear entries for the day after creating a receipt

      // Build backend payload preserving original structure
      const payload = buildPayloadFromEntries(updatedEntries);

      // Submit to backend
      const footprintResponse = await submitFootprint(payload);

      // Save footprint data (structure depends on backend) and today's entry
      const respData = footprintResponse.data ?? footprintResponse;
      setFootprintData(respData);
      localStorage.setItem('current_footprint_id', respData.footprintId ?? respData.id ?? '');
      localStorage.setItem('current_footprint_data', JSON.stringify(respData));

      // set todayEntry for display
      setTodayEntry({
        date: new Date().toISOString(),
        calculatedFootprint: respData.calculatedFootprint ?? { total: newReceipt.totalCO2e, transport: 0, homeEnergy: 0, food: 0 },
      });

      setLoadingStatus('success');
      toast({ title: "Carbon footprint calculated!", description: `Total: ${(respData.calculatedFootprint?.total ?? newReceipt.totalCO2e).toFixed ? (respData.calculatedFootprint.total).toFixed(2) : newReceipt.totalCO2e.toFixed(2)} kg CO₂e` });
    } catch (err: any) {
      console.error('Error calculating/submitting footprint', err);
      setErrorMessage(err?.message || 'Failed to calculate footprint');
      setLoadingStatus('error');
      toast({ title: "Error", description: err?.message || "Failed to submit footprint", variant: "destructive" });
    }
  };

  // Handler: Manual fetch recommendations using today's footprint data
  const handleGetRecommendations = async () => {
    if (!footprintData?.footprintId && !localStorage.getItem('current_footprint_id')) {
      toast({ title: "No today's footprint found", description: "Please calculate your carbon footprint first", variant: "destructive" });
      return;
    }

    const footprintId = footprintData?.footprintId ?? localStorage.getItem('current_footprint_id')!;
    try {
      setIsFetchingRecommendations(true);
      setErrorMessage(null);

      const recResp = await fetchRecommendations(footprintId);
      const recData = recResp.data ?? recResp;
      setRecommendations(recData.recommendations ?? recData.recommendations ?? []);
      localStorage.setItem('current_recommendations', JSON.stringify(recData.recommendations ?? recData.recommendations ?? []));

      setIsFetchingRecommendations(false);
      toast({ title: "Recommendations ready", description: `Generated ${ (recData.recommendations ?? []).length } recommendations` });
    } catch (err: any) {
      console.error('Error fetching recommendations', err);
      setErrorMessage(err?.message || 'Failed to fetch recommendations');
      setIsFetchingRecommendations(false);
      toast({ title: "Recommendation Error", description: err?.message || "Failed to fetch recommendations", variant: "destructive" });
    }
  };

  // Edit/reset footprint
  const handleEditFootprint = async () => {
    const confirmReset = window.confirm("⚠️ Warning: Editing your footprint will reset today's carbon tracking and uncheck all completed eco-challenges. Do you want to continue?");
    if (!confirmReset) return;

    try {
      await resetDailyData();

      // Reset frontend state
      setReceipts([]);
      setEntries([]);
      setRecommendations([]);
      setFootprintData(null);
      setTodayEntry(null);
      setLoadingStatus('idle');
      setErrorMessage(null);

      localStorage.removeItem('current_footprint_id');
      localStorage.removeItem('current_footprint_data');
      localStorage.removeItem('current_recommendations');

      toast({ title: "Daily data reset", description: "Your carbon tracking and eco-challenges have been reset." });
    } catch (err: any) {
      console.error('Reset failed', err);
      toast({ title: "Reset failed", description: err?.message || "Failed to reset your daily data.", variant: "destructive" });
    }
  };

  // Retry recommendations using same footprint
  const handleRetryRecommendations = async () => {
    // same as handleGetRecommendations but keeps previous recommendations if fails
    await handleGetRecommendations();
  };

  // UI loading guard on initial auth check
  if (isPending) return <LoadingSpinner />;
  if (activitiesLoading) { /* we can still render UI while activities load */ }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Navbar kept from original approach - pass isLoggedIn prop if desired */}
      {/* @ts-ignore - your Navbar accepts isLoggedIn and onLogout in original file */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Leaf className="h-8 w-8 text-primary" />
                Track
              </h1>
              <p className="text-muted-foreground mt-1">Monitor your carbon footprint</p>
            </div>

            <div className="flex gap-3 items-center">
              <Button onClick={() => refetchActivities()} variant="ghost" className="hidden sm:inline">Refresh Activities</Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                    <Plus className="h-5 w-5" />
                    Add Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader className="space-y-3">
                    <DialogTitle className="text-2xl">Add New Entry</DialogTitle>
                    <p className="text-sm text-muted-foreground">Track your daily activities and food consumption</p>
                  </DialogHeader>

                  <Tabs value={entryType} onValueChange={(v) => setEntryType(v as EntryType)} className="mt-2">
                    <TabsList className="grid w-full grid-cols-2 h-12">
                      <TabsTrigger value="distance" className="text-base gap-2">
                        <Car className="h-4 w-4" />
                        Distance
                      </TabsTrigger>
                      <TabsTrigger value="food" className="text-base gap-2">
                        <Utensils className="h-4 w-4" />
                        Food
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="distance" className="space-y-5 mt-6">
                      <Tabs value={distanceMode} onValueChange={(v) => setDistanceMode(v as "tracked" | "manual")}>
                        <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/50">
                          <TabsTrigger value="tracked" className="text-sm">From Tracked</TabsTrigger>
                          <TabsTrigger value="manual" className="text-sm">Manual Entry</TabsTrigger>
                        </TabsList>

                        <TabsContent value="tracked" className="space-y-4 mt-5">
                          <Label className="text-base font-semibold">Select Tracked Activities</Label>
                          {trackedActivities.length === 0 ? (
                            <div className="text-sm text-muted-foreground text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed">
                              <Car className="h-10 w-10 mx-auto mb-3 opacity-50" />
                              <p className="font-medium mb-1">No tracked activities found</p>
                              <p className="text-xs">Use Track Distance first or switch to manual entry</p>
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                              {trackedActivities.map((activity: any) => (
                                <div
                                  key={activity.id}
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${ selectedTrackedIds.includes(activity.id) ? "bg-primary/10 border-primary shadow-sm" : "hover:bg-muted/50 border-border" }`}
                                  onClick={() => {
                                    setSelectedTrackedIds(prev => prev.includes(activity.id) ? prev.filter(id => id !== activity.id) : [...prev, activity.id]);
                                  }}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={selectedTrackedIds.includes(activity.id)}
                                        readOnly
                                        className="h-5 w-5 rounded border-2"
                                      />
                                      <Badge variant="secondary" className="text-xs font-semibold">
                                        {String(activity.category).toUpperCase()}
                                      </Badge>
                                      <span className="font-semibold text-base">{activity.subtype}</span>
                                    </div>
                                    <span className="font-bold text-lg text-primary">{(activity.distance || 0).toFixed(2)} km</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-5 mt-5">
                          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                            <Label className="text-base font-semibold">Category</Label>
                            <Select
                              value={distanceCategory}
                              onValueChange={(v) => {
                                setDistanceCategory(v);
                                setDistanceSubtype(transportTypes[v as keyof typeof transportTypes][0]);
                              }}
                            >
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">🚗 Private</SelectItem>
                                <SelectItem value="public">🚌 Public</SelectItem>
                                <SelectItem value="basic">🚶 Basic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                            <Label className="text-base font-semibold">Type</Label>
                            <Select value={distanceSubtype} onValueChange={setDistanceSubtype}>
                              <SelectTrigger className="h-12 text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {transportTypes[distanceCategory as keyof typeof transportTypes].map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                            <Label className="text-base font-semibold">Distance (km)</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="Enter distance"
                              value={distance}
                              onChange={(e) => setDistance(e.target.value)}
                              className="h-12 text-base"
                            />
                          </div>
                        </TabsContent>
                      </Tabs>

                      <Button onClick={handleAddEntry} className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                        Add Distance Entry
                      </Button>
                    </TabsContent>

                    <TabsContent value="food" className="space-y-5 mt-6">
                      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                        <Label className="text-base font-semibold">Food Type</Label>
                        <Select value={foodType} onValueChange={setFoodType}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="meat">🥩 Meat</SelectItem>
                            <SelectItem value="fish">🐟 Fish</SelectItem>
                            <SelectItem value="dairy">🥛 Dairy</SelectItem>
                            <SelectItem value="mixed">🥗 Mixed</SelectItem>
                            <SelectItem value="skipped">⏭️ Skipped</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                        <Label className="text-base font-semibold">What food?</Label>
                        <Input
                          type="text"
                          placeholder="e.g., Beef steak, Salmon, Cheese, Vegetable salad"
                          value={foodName}
                          onChange={(e) => setFoodName(e.target.value)}
                          className="h-12 text-base"
                        />
                      </div>

                      <Button onClick={handleAddEntry} className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow">
                        Add Food Entry
                      </Button>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary & Today's Entry */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center mb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Today's Entry
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Button variant="outline" onClick={handleEditFootprint} size="sm" className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Edit Footprint
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Transport</div>
                    <div className="text-xl font-bold">{todayEntry?.calculatedFootprint?.transport ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">kg CO₂e</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Home Energy</div>
                    <div className="text-xl font-bold">{todayEntry?.calculatedFootprint?.homeEnergy ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">kg CO₂e</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground">Food</div>
                    <div className="text-xl font-bold">{todayEntry?.calculatedFootprint?.food ?? '-'}</div>
                    <div className="text-xs text-muted-foreground">kg CO₂e</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold">{todayEntry?.calculatedFootprint?.total ?? '-' } kg CO₂e</div>
                  </div>

                  <div className="flex gap-2">
                    {/* Calculate button - enabled when there are entries */}
                    {entries.length > 0 && (
                      <Button onClick={handleCalculateFootprint} className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Calculate Carbon Footprint
                      </Button>
                    )}

                    {/* Get AI Recs button - only appears after a footprint exists */}
                    {(footprintData || localStorage.getItem('current_footprint_id')) && (
                      <Button onClick={handleGetRecommendations} className="flex items-center gap-2" disabled={isFetchingRecommendations}>
                        <Sparkles className="h-4 w-4" />
                        {isFetchingRecommendations ? 'Generating...' : 'Get AI Recommendations'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Receipts summary */}
            {receipts.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Summary
                </h2>
                <div className="grid gap-4 mt-3">
                  {receipts.map(receipt => (
                    <Card key={receipt.id} className="border-2 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            {new Date(receipt.date).toLocaleString()}
                          </CardTitle>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{receipt.totalCO2e.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground font-medium">kg CO₂e</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2">
                        {receipt.entries.map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-background rounded-lg">
                                {getEntryIcon(entry)}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{entry.type === 'distance' ? (entry.category ?? 'TRANSPORT').toUpperCase() : 'FOOD'}</Badge>
                                  <span className="font-semibold text-sm">{entry.subtype.charAt(0).toUpperCase() + entry.subtype.slice(1)}</span>
                                </div>
                                {entry.type === 'distance' && <p className="text-xs text-muted-foreground mt-1">{entry.value.toFixed(2)} km</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-primary">{(entry.co2e ?? 0).toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground">kg CO₂e</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Log (current unsent entries) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Activity Log</h2>
                {entries.length > 0 && (
                  <Button onClick={handleCalculateFootprint} size="lg" className="gap-2 shadow-lg hover:shadow-xl transition-shadow">
                    <Calculator className="h-5 w-5" />
                    Calculate Carbon Footprint
                  </Button>
                )}
              </div>

              {entries.length === 0 ? (
                <Card className="border-2 border-dashed">
                  <CardContent className="pt-6 text-center py-16">
                    <Leaf className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-xl font-semibold mb-2">No entries yet</p>
                    <p className="text-sm text-muted-foreground mb-6">Start tracking your activities and food consumption</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {entries.map(entry => (
                    <Card key={entry.id} className="hover:shadow-md transition-shadow border-2">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-primary/10 rounded-xl">{getEntryIcon(entry)}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs">{entry.type === "distance" ? (entry.category ?? "TRANSPORT").toUpperCase() : "FOOD"}</Badge>
                                <span className="font-bold text-base">{entry.subtype.charAt(0).toUpperCase() + entry.subtype.slice(1)}</span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(entry.timestamp)}
                                </div>
                                {entry.type === "distance" && <span className="font-semibold">{entry.value.toFixed(2)} km</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations view (if fetched) */}
            {recommendations.length > 0 && (
              <div className="mt-6">
                <RecommendationView recommendations={recommendations} footprintData={footprintData} onRetry={handleRetryRecommendations} />
              </div>
            )}

            {/* Error state */}
            {loadingStatus === 'error' && (
              <Card className="shadow-card border-border border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Error
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
