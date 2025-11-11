// client/src/pages/TrackCarbon.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import {
  Car,
  Zap,
  Utensils,
  Plane,
  Home,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Lightbulb,
  Calculator,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import {
  logout,
  getTodaysTracking,
  getDailyTrackingHistory,
} from "../lib/api";
import queryClient from "../config/queryClient";
import useSessions from "../hooks/useSessions";
import useAuth from "../hooks/useAuth";
import RecommendationView from "../components/RecommendationView";
import LoadingSpinner from "../components/LoadingSpinner";
import useActivityTrack from "@/hooks/useActivityTrack";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Category = "transport" | "home" | "food";

type BaseEntry = {
  id: string;
  category: Category;
  createdAt: string;
};

type TransportEntry = BaseEntry & {
  category: "transport";
  mode:
    | "car"
    | "public_transport"
    | "motorcycle"
    | "bicycle"
    | "walking"
    | "flight"
    | "no_travel";
  distanceKm?: number;
  flightType?: "short-haul" | "long-haul" | undefined;
};

type HomeEntry = BaseEntry & {
  category: "home";
  homeType: "large_house" | "small_house" | "apartment";
  occupants: number;
  appliances: "aircon" | "laundry" | "none";
};

type FoodEntry = BaseEntry & {
  category: "food";
  mealSlot: "breakfast" | "lunch" | "dinner";
  mealType: "meat" | "fish" | "plant" | "dairy" | "mixed" | "skipped";
  description?: string;
};

type Entry = TransportEntry | HomeEntry | FoodEntry;

interface FootprintResponse {
  success: boolean;
  data: {
    id: string;
    footprintId: string;
    isUpdate: boolean;
    calculatedFootprint: {
      transport: number;
      homeEnergy: number;
      food: number;
      total: number;
    };
    breakdown: {
      transport: number;
      homeEnergy: number;
      food: number;
      total: number;
    };
    newAchievements?: any[];
  };
}

interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: any[];
    footprintSummary: {
      total: number;
      transport: number;
      homeEnergy: number;
      food: number;
      date: string;
    };
    cached: boolean;
    generatedAt: string;
    processingTime?: number;
  };
}

const makeId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const ANIM = { initial: { opacity: 0, y: 6 }, enter: { opacity: 1, y: 0 } };

const TrackCarbon = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessions, isPending, isError } = useSessions();
  const { user } = useAuth() as { user: { _id?: string } };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // entries
  const [entries, setEntries] = useState<Entry[]>([]);

  // modal & dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Category>("transport");

  // forms inside modal
  const [transportForm, setTransportForm] = useState<Partial<TransportEntry>>({
    mode: "car",
    distanceKm: 0,
    flightType: undefined,
  });
  const [homeForm, setHomeForm] = useState<Partial<HomeEntry>>({
    homeType: "apartment",
    occupants: 0,
    appliances: "none",
  });
  const [foodForm, setFoodForm] = useState<Partial<FoodEntry>>({
    mealSlot: "breakfast",
    mealType: "meat",
    description: "",
  });

  // activity tracking
  const {
    activities,
    isLoading: isActivitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useActivityTrack();

  // footprint & recommendations
  const [footprintData, setFootprintData] =
    useState<FootprintResponse["data"] | null>(null);
  const [footprintId, setFootprintId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // UI animation states for progress bars
  const [animTransport, setAnimTransport] = useState(0);
  const [animHome, setAnimHome] = useState(0);
  const [animFood, setAnimFood] = useState(0);

  // restore persisted state
  useEffect(() => {
    const savedEntries = localStorage.getItem("current_entries");
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch {
        localStorage.removeItem("current_entries");
      }
    }

    const savedFootprint = localStorage.getItem("current_footprint_data");
    if (savedFootprint) {
      try {
        const parsed = JSON.parse(savedFootprint);
        setFootprintData(parsed);
        setFootprintId(parsed.footprintId);
        // set anim values to actuals after a small delay
        setTimeout(() => {
          const t = parsed.calculatedFootprint.transport || 0;
          const h = parsed.calculatedFootprint.homeEnergy || 0;
          const f = parsed.calculatedFootprint.food || 0;
          setAnimTransport(t);
          setAnimHome(h);
          setAnimFood(f);
        }, 200);
      } catch {}
    }

    const savedRecs = localStorage.getItem("current_recommendations");
    if (savedRecs) {
      try {
        setRecommendations(JSON.parse(savedRecs));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("current_entries", JSON.stringify(entries));
  }, [entries]);

  // session & fetching today/history
  useEffect(() => {
    if (!isPending && sessions.length > 0) {
      const logged = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(logged);
    }
    if (!isPending && (isError || sessions.length === 0)) {
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    }
  }, [isPending, isError, sessions, navigate]);

  useEffect(() => {
    if (!isLoggedIn || !user || footprintData) return;
    (async () => {
      try {
        const res = await getTodaysTracking();
        // don't override entries; keep today's stored footprint separate
        // you already store today's entry in a separate panel below if needed
      } catch {}
    })();
  }, [isLoggedIn, user, footprintData]);

  // logout
  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
  const handleSignOut = () => signOut();

  // API wrappers
  const submitFootprint = async (trackingData: any): Promise<FootprintResponse> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/footprint/submit`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(trackingData),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to submit footprint");
    }
    return response.json();
  };

  const fetchRecommendations = async (
    id: string
  ): Promise<RecommendationResponse> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/recommendations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ footprintId: id }),
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to fetch recommendations");
    }
    return response.json();
  };

  const resetDailyData = async (): Promise<void> => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/footprint/reset-daily`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      }
    );
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || "Failed to reset daily data");
    }
  };

  // create entries
  const createTransportEntryFromForm = (): TransportEntry => ({
    id: makeId(),
    category: "transport",
    createdAt: new Date().toISOString(),
    mode: (transportForm.mode as TransportEntry["mode"]) || "car",
    distanceKm:
      transportForm.mode === "no_travel" ? 0 : Number(transportForm.distanceKm || 0),
    flightType: transportForm.flightType,
  });

  const createHomeEntryFromForm = (): HomeEntry => ({
    id: makeId(),
    category: "home",
    createdAt: new Date().toISOString(),
    homeType: (homeForm.homeType as HomeEntry["homeType"]) || "small_house",
    occupants: Number(homeForm.occupants || 0),
    appliances: (homeForm.appliances as HomeEntry["appliances"]) || "none",
  });

  const createFoodEntryFromForm = (): FoodEntry => ({
    id: makeId(),
    category: "food",
    createdAt: new Date().toISOString(),
    mealSlot: (foodForm.mealSlot as FoodEntry["mealSlot"]) || "breakfast",
    mealType: (foodForm.mealType as FoodEntry["mealType"]) || "plant",
    description: foodForm.description || "",
  });

  const addOrUpdateEntry = (entry: Entry) => {
    if (editingId) {
      setEntries((prev) => prev.map((e) => (e.id === editingId ? { ...entry, id: editingId } : e)));
      setEditingId(null);
      toast({ title: "Saved", description: "Entry updated." });
    } else {
      setEntries((prev) => [entry, ...prev]);
      toast({ title: "Added", description: "Entry added." });
    }
  };

  // add handlers
  const handleAddTransport = () => {
    const entry = createTransportEntryFromForm();
    addOrUpdateEntry(entry);
    setTransportForm({ mode: "car", distanceKm: 0, flightType: undefined });
    setIsAddOpen(false);
  };
  const handleAddHome = () => {
    if (!homeForm.homeType || Number(homeForm.occupants || 0) < 1) {
      toast({ title: "Invalid", description: "Choose home type & occupants.", variant: "destructive" });
      return;
    }
    const entry = createHomeEntryFromForm();
    addOrUpdateEntry(entry);
    setHomeForm({ homeType: "small_house", occupants: 0, appliances: "none" });
    setIsAddOpen(false);
  };
  const handleAddFood = () => {
    const entry = createFoodEntryFromForm();
    addOrUpdateEntry(entry);
    setFoodForm({ mealSlot: "breakfast", mealType: "meat", description: "" });
    setIsAddOpen(false);
  };

  // edit flow: open modal pre-filled
  const handleEditEntry = (id: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setIsAddOpen(true);
    setActiveTab(e.category);
    if (e.category === "transport") {
      const t = e as TransportEntry;
      setTransportForm({ mode: t.mode, distanceKm: t.distanceKm || 0, flightType: t.flightType });
    } else if (e.category === "home") {
      const h = e as HomeEntry;
      setHomeForm({ homeType: h.homeType, occupants: h.occupants, appliances: h.appliances });
    } else {
      const f = e as FoodEntry;
      setFoodForm({ mealSlot: f.mealSlot, mealType: f.mealType, description: f.description });
    }
  };

  // delete flow: open dialog per-item
  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };
  const executeDelete = () => {
    if (!deleteTargetId) return;
    setEntries((prev) => prev.filter((e) => e.id !== deleteTargetId));
    setIsDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    toast({ title: "Deleted", description: "Entry removed." });
  };

  // import from live tracking
  const handleImportFromLiveTracking = () => {
    if (!activities || activities.length === 0) {
      toast({ title: "No live data", description: "No tracked activities to import.", variant: "destructive" });
      return;
    }
    const imported = activities.map((act: any) => {
      const subtype = String(act.subtype || "").toLowerCase();
      let mode: TransportEntry["mode"] = "walking";
      if (["walk", "walking"].includes(subtype)) mode = "walking";
      else if (["bicycle", "bike"].includes(subtype)) mode = "bicycle";
      else if (["diesel", "gasoline", "car"].includes(subtype)) mode = "car";
      else if (["motorcycle"].includes(subtype)) mode = "motorcycle";
      else if (["public", "bus", "jeep", "train", "tricycle", "e-jeep"].includes(subtype)) mode = "public_transport";
      const distance = Number(act.totalDistance || 0);
      return {
        id: makeId(),
        category: "transport",
        createdAt: new Date().toISOString(),
        mode,
        distanceKm: distance,
      } as TransportEntry;
    });
    setEntries((prev) => [...imported, ...prev]);
    setIsAddOpen(false);
    toast({ title: "Imported", description: `Imported ${imported.length} activities.` });
  };

  // calculate payload & call API
  const handleCalculate = async () => {
    if (entries.length === 0) {
      toast({ title: "No entries", description: "Add entries before calculating.", variant: "destructive" });
      return;
    }

    const transportAgg: Record<string, number> = {};
    let flightsToday: "none" | "short-haul" | "long-haul" = "none";

    entries.forEach((e) => {
      if (e.category === "transport") {
        const t = e as TransportEntry;
        if (t.mode === "flight") {
          if (t.flightType === "long-haul") flightsToday = "long-haul";
          else if (flightsToday !== "long-haul" && t.flightType === "short-haul") flightsToday = "short-haul";
        } else {
          transportAgg[t.mode] = (transportAgg[t.mode] || 0) + Number(t.distanceKm || 0);
        }
      }
    });

    const transportModes = Object.entries(transportAgg).map(([id, distance]) => ({ id, distance: Number(distance.toFixed(2)) }));

    const homeEntries = entries.filter((e) => e.category === "home") as HomeEntry[];
    let homeEnergyPayload = { homeType: "small_house", occupants: 0, appliances: ["none"] as any[] };
    if (homeEntries.length > 0) {
      const latest = homeEntries.sort((a,b) => +new Date(b.createdAt) - +new Date(a.createdAt))[0];
      homeEnergyPayload = { homeType: latest.homeType, occupants: latest.occupants, appliances: [latest.appliances] };
    }

    const foodEntries = entries.filter((e) => e.category === "food") as FoodEntry[];
    const foodPayload: any = { breakfast: "skipped", lunch: "skipped", dinner: "skipped", breakfastFood: "", lunchFood: "", dinnerFood: "" };
    if (foodEntries.length > 0) {
      const latestBySlot: Record<string, FoodEntry> = {};
      foodEntries.forEach((f) => {
        const prev = latestBySlot[f.mealSlot];
        if (!prev || new Date(f.createdAt) > new Date(prev.createdAt)) latestBySlot[f.mealSlot] = f;
      });
      if (latestBySlot.breakfast) { foodPayload.breakfast = latestBySlot.breakfast.mealType; foodPayload.breakfastFood = latestBySlot.breakfast.description || ""; }
      if (latestBySlot.lunch) { foodPayload.lunch = latestBySlot.lunch.mealType; foodPayload.lunchFood = latestBySlot.lunch.description || ""; }
      if (latestBySlot.dinner) { foodPayload.dinner = latestBySlot.dinner.mealType; foodPayload.dinnerFood = latestBySlot.dinner.description || ""; }
    }

    const payload = {
      transport: { modes: transportModes, distances: Object.assign({}, ...transportModes.map((m:any) => ({ [m.id]: m.distance }))) },
      flightsToday: flightsToday === "none" ? "none" : flightsToday,
      homeEnergy: homeEnergyPayload,
      food: foodPayload,
      rawEntries: entries,
    };

    try {
      setLoadingStatus("loading");
      setErrorMessage(null);
      const res = await submitFootprint(payload);
      setFootprintData(res.data);
      setFootprintId(res.data.footprintId);
      localStorage.setItem("current_footprint_data", JSON.stringify(res.data));
      // animate progress bars to category values (raw)
      const t = res.data.calculatedFootprint.transport || 0;
      const h = res.data.calculatedFootprint.homeEnergy || 0;
      const f = res.data.calculatedFootprint.food || 0;
      // smooth animation: incrementally step up
      setAnimTransport(0); setAnimHome(0); setAnimFood(0);
      const dur = 600;
      const steps = 30;
      for (let i=1;i<=steps;i++){
        setTimeout(()=> {
          setAnimTransport(Number(((t * i) / steps).toFixed(2)));
          setAnimHome(Number(((h * i) / steps).toFixed(2)));
          setAnimFood(Number(((f * i) / steps).toFixed(2)));
        }, Math.round((i * dur)/steps));
      }
      setLoadingStatus("success");
      toast({ title: "Calculated", description: `Total: ${res.data.calculatedFootprint.total} kg CO₂e.` });
    } catch (err: any) {
      console.error(err);
      setLoadingStatus("error");
      setErrorMessage(err.message || "Failed to calculate footprint");
      toast({ title: "Error", description: err.message || "Calculation failed", variant: "destructive" });
    }
  };

  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);

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
  }, [isLoggedIn, user]);



  // get AI recommendations (separate)
  const handleGetRecommendations = async () => {
    const id = footprintId || footprintData?.footprintId;
    if (!id) {
      toast({ title: "No footprint", description: "Calculate first.", variant: "destructive" });
      return;
    }
    try {
      setLoadingStatus("loading");
      const rec = await fetchRecommendations(id);
      setRecommendations(rec.data.recommendations);
      localStorage.setItem("current_recommendations", JSON.stringify(rec.data.recommendations));
      setLoadingStatus("success");
      toast({ title: "Recommendations ready", description: `Generated ${rec.data.recommendations.length} recommendations.` });
    } catch (err: any) {
      setLoadingStatus("error");
      setErrorMessage(err.message || "Failed to fetch recommendations");
      toast({ title: "Error", description: err.message || "Failed to fetch recommendations", variant: "destructive" });
    }
  };

  // reset footprint (dialog)
  const handleConfirmReset = async () => {
    setIsResetConfirmOpen(false);
    try {
      await resetDailyData();
      setFootprintData(null);
      setFootprintId(null);
      setRecommendations([]);
      setLoadingStatus("idle");
      localStorage.removeItem("current_footprint_data");
      localStorage.removeItem("current_recommendations");
      toast({ title: "Reset", description: "Daily data reset. You can add new entries." });
    } catch (err: any) {
      toast({ title: "Reset failed", description: err.message || "Reset failed", variant: "destructive" });
    }
  };

  // computed totals (use footprintData if available)
  const totals = useMemo(() => {
    if (!footprintData) return { transport: 0, homeEnergy: 0, food: 0, total: 0 };
    return {
      transport: Number(footprintData.calculatedFootprint.transport || 0),
      homeEnergy: Number(footprintData.calculatedFootprint.homeEnergy || 0),
      food: Number(footprintData.calculatedFootprint.food || 0),
      total: Number(footprintData.calculatedFootprint.total || 0),
    };
  }, [footprintData]);

  // distinct accent colors for progress bars: transport-blue, home-green, food-amber
  const transportColor = "bg-primary";
  const homeColor = "bg-green-500";
  const foodColor = "bg-amber-500";

  if (isPending) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If recommendations exist -> show recommendations view */}
        {recommendations && recommendations.length > 0 ? (
          <div>
            <RecommendationView recommendations={recommendations} footprintData={footprintData} onRetry={async () => {
              const id = footprintId || (footprintData as any)?.footprintId;
              if (!id) return;
              try {
                setLoadingStatus("loading");
                const rec = await fetchRecommendations(id);
                setRecommendations(rec.data.recommendations);
                setLoadingStatus("success");
              } catch (err:any) {
                setLoadingStatus("error");
              }
            }} />
          </div>
        ) : (
          // Main add/entries view or dashboard when footprint exists
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Calculator className="h-8 w-8 text-primary" />
                Add Entries — Track Your Carbon
              </h1>
              <p className="text-muted-foreground">
                Add Transport, Home Energy, and Food entries. Import live-tracked activities or add manually.
              </p>
            </div>

            {/* Top controls */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingId(null); setActiveTab("transport"); }}>
                      <Plus className="w-5 h-5" /> Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>{editingId ? "Edit Entry" : "Add New Entry"}</DialogTitle></DialogHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Category)}>
                      <TabsList>
                        <TabsTrigger value="transport">Transport</TabsTrigger>
                        <TabsTrigger value="home">Home Energy</TabsTrigger>
                        <TabsTrigger value="food">Food</TabsTrigger>
                      </TabsList>

                  <TabsContent value="transport" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                      {/* Mode */}
                      <div>
                        <Label>Mode</Label>
                        <Select
                          value={transportForm.mode}
                          onValueChange={(v) =>
                            setTransportForm((prev) => ({ ...prev, mode: v as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="car">Personal Car</SelectItem>
                            <SelectItem value="public_transport">Public Transport</SelectItem>
                            <SelectItem value="motorcycle">Motorcycle</SelectItem>
                            <SelectItem value="bicycle">Bicycle / E-bike</SelectItem>
                            <SelectItem value="walking">Walking</SelectItem>
                            <SelectItem value="flight">Flight</SelectItem>
                            <SelectItem value="no_travel">Didn't commute today</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                        
                      {/* Distance */}
                      <div>
                        <Label>Distance (km)</Label>
                        <Input
                          type="number"
                          placeholder="km"
                          value={transportForm.distanceKm ?? ""}
                          onChange={(e) =>
                            setTransportForm((prev) => ({
                              ...prev,
                              distanceKm: Number(e.target.value || 0),
                            }))
                          }
                          disabled={
                            transportForm.mode === "no_travel" ||
                            transportForm.mode === "flight"
                          }
                        />
                      </div>
                        
                      {/* Only show Flight Type if mode === "flight" */}
                      {transportForm.mode === "flight" && (
                        <div>
                          <Label>Flight type</Label>
                          <Select
                            value={transportForm.flightType}
                            onValueChange={(v) =>
                              setTransportForm((prev) => ({
                                ...prev,
                                flightType: (v as any) || undefined,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select flight type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short-haul">Short-haul (&lt;3h)</SelectItem>
                              <SelectItem value="long-haul">Long-haul (&gt;3h)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <Button
                        onClick={() => {
                          if (editingId) setIsSaveConfirmOpen(true)
                          else handleAddTransport()
                        }}
                      >
                        {editingId ? "Save Transport" : "Add Transport"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() =>
                          setTransportForm({ mode: "car", distanceKm: 0, flightType: undefined })
                        }
                      >
                        Reset
                      </Button>
                      <Button variant="ghost" onClick={handleImportFromLiveTracking}>
                        Import from Live Tracking
                      </Button>
                    </div>
                  </TabsContent>


                      <TabsContent value="home" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label>Home Type</Label>
                            <Select value={homeForm.homeType} onValueChange={(v) => setHomeForm(prev=>({...prev, homeType: v as any}))}>
                              <SelectTrigger><SelectValue placeholder="Choose home" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="large_house">Large House</SelectItem>
                                <SelectItem value="small_house">Small House</SelectItem>
                                <SelectItem value="apartment">Apartment / Condo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Occupants</Label>
                            <Input type="number" min={1} value={homeForm.occupants ?? 1} onChange={(e)=>setHomeForm(prev=>({...prev, occupants: Number(e.target.value||1)}))} />
                          </div>

                          <div>
                            <Label>Appliances</Label>
                            <Select value={homeForm.appliances as any} onValueChange={(v)=>setHomeForm(prev=>({...prev, appliances: v as any}))}>
                              <SelectTrigger><SelectValue placeholder="Choose appliance" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aircon">Aircon</SelectItem>
                                <SelectItem value="laundry">Laundry</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button onClick={()=>{ if (editingId) setIsSaveConfirmOpen(true); else handleAddHome(); }}>
                            {editingId ? "Save Home" : "Add Home"}
                          </Button>
                          <Button variant="outline" onClick={()=>setHomeForm({homeType:"apartment", occupants:1, appliances:"none"})}>Reset</Button>
                          <Button variant="ghost" onClick={handleImportFromLiveTracking}>Import from Live Tracking</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="food" className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label>Meal Slot</Label>
                            <Select value={foodForm.mealSlot} onValueChange={(v)=>setFoodForm(prev=>({...prev, mealSlot: v as any}))}>
                              <SelectTrigger><SelectValue placeholder="Choose slot" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="breakfast">Breakfast</SelectItem>
                                <SelectItem value="lunch">Lunch</SelectItem>
                                <SelectItem value="dinner">Dinner</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Type</Label>
                            <Select value={foodForm.mealType} onValueChange={(v)=>setFoodForm(prev=>({...prev, mealType: v as any}))}>
                              <SelectTrigger><SelectValue placeholder="Meal type" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="meat">Meat-based</SelectItem>
                                <SelectItem value="fish">Fish-based</SelectItem>
                                <SelectItem value="plant">Plant-based</SelectItem>
                                <SelectItem value="dairy">Dairy</SelectItem>
                                <SelectItem value="mixed">Mixed</SelectItem>
                                <SelectItem value="skipped">Skipped</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Description</Label>
                            <Input value={foodForm.description || ""} onChange={(e)=>setFoodForm(prev=>({...prev, description: e.target.value}))} placeholder="e.g., tuna, rice" />
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button onClick={()=>{ if (editingId) setIsSaveConfirmOpen(true); else handleAddFood(); }}>
                            {editingId ? "Save Food" : "Add Food"}
                          </Button>
                          <Button variant="outline" onClick={()=>setFoodForm({mealSlot:"breakfast", mealType:"plant", description:""})}>Reset</Button>
                          <Button variant="ghost" onClick={handleImportFromLiveTracking}>Import from Live Tracking</Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {/* Save confirm dialog (when editing) */}
                <Dialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Save changes?</DialogTitle></DialogHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Save edits to this entry?</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={()=>setIsSaveConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={()=>{
                          if (!editingId) { setIsSaveConfirmOpen(false); return; }
                          const newEntry = activeTab === "transport" ? createTransportEntryFromForm() :
                                           activeTab === "home" ? createHomeEntryFromForm() :
                                           createFoodEntryFromForm();
                          const updated = { ...newEntry, id: editingId, createdAt: new Date().toISOString() } as Entry;
                          setEntries(prev => prev.map(e => e.id === editingId ? updated : e));
                          setEditingId(null);
                          setIsSaveConfirmOpen(false);
                          setIsAddOpen(false);
                          toast({ title: "Saved", description: "Entry updated." });
                        }}>Save</Button>
                      </div>
                    </CardContent>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCalculate} disabled={loadingStatus === "loading"}>
                 <Calculator /> Calculate Carbon Footprint
                </Button>
                <Button onClick={handleGetRecommendations} disabled={!footprintData && !footprintId}>
                  <Lightbulb/> Get AI Recommendations
                </Button>
              </div>
            </div>

            {/* Dashboard summary (if footprint calculated OR restored) */}
            {footprintData && (
              <motion.div initial="initial" animate="enter" variants={ANIM} className="mb-6">
                <Card className="shadow-card border-border">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-6 w-6 text-warning" />
                          Your Footprint Summary
                        </CardTitle>
                        <CardDescription className="text-sm">Detailed breakdown of your latest calculated footprint</CardDescription>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total CO₂e</div>
                        <div className="text-2xl font-bold">{footprintData.calculatedFootprint.total} kg</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Transport */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <Car className="h-6 w-6 text-primary" />
                        <div>
                          <div className="text-sm font-medium">Transport</div>
                          <div className="text-xs text-muted-foreground">Raw kg CO₂e</div>
                        </div>
                      </div>

                      <div className="col-span-1 md:col-span-1">
                        <div className="text-sm font-semibold">{animTransport.toFixed(2)} kg</div>
                        <div className="mt-2">
                          <Progress value={Math.min(100, (animTransport / Math.max(footprintData.calculatedFootprint.total, 1)) * 100)} className="h-2" />
                        </div>
                      </div>

                      <div className="hidden md:block text-sm text-muted-foreground">
                        {/* Optional extra info */}
                      </div>
                    </div>

                    {/* Home Energy */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-green-600" />
                        <div>
                          <div className="text-sm font-medium">Home Energy</div>
                          <div className="text-xs text-muted-foreground">Raw kg CO₂e</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold">{animHome.toFixed(2)} kg</div>
                        <div className="mt-2">
                          <Progress value={Math.min(100, (animHome / Math.max(footprintData.calculatedFootprint.total, 1)) * 100)} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Food */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <div className="flex items-center gap-3">
                        <Utensils className="h-6 w-6 text-amber-600" />
                        <div>
                          <div className="text-sm font-medium">Food</div>
                          <div className="text-xs text-muted-foreground">Raw kg CO₂e</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold">{animFood.toFixed(2)} kg</div>
                        <div className="mt-2">
                          <Progress value={Math.min(100, (animFood / Math.max(footprintData.calculatedFootprint.total, 1)) * 100)} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Edit button below */}
                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => { setIsResetConfirmOpen(true); }}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Edit My Footprint
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Entries list (cards) */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              {entries.length === 0 && (
                <Card className="shadow-card border-border p-6">
                  <CardContent className="text-center text-muted-foreground">No entries yet. Add entries using the pop-up above.</CardContent>
                </Card>
              )}

              {entries.map((e) => (
                <Card key={e.id} className="shadow-card border-border">
                  <CardHeader className="flex flex-row justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                        {e.category === "transport" && <Car className="h-5 w-5 text-muted-foreground" />}
                        {e.category === "home" && <Home className="h-5 w-5 text-muted-foreground" />}
                        {e.category === "food" && <Utensils className="h-5 w-5 text-muted-foreground" />}
                        <span className="capitalize">{e.category}</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-muted-foreground mt-1">
                        {new Date(e.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-28">
                        <DropdownMenuItem onClick={() => handleEditEntry(e.id)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setIsDeleteConfirmOpen(true)
                            setDeleteTargetId(e.id)
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                        
                    <Dialog
                      open={isDeleteConfirmOpen && deleteTargetId === e.id}
                      onOpenChange={(v) => {
                        if (!v) {
                          setIsDeleteConfirmOpen(false)
                          setDeleteTargetId(null)
                        }
                      }}
                    >
                      <DialogContent className="sm:max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Delete Entry</DialogTitle>
                        </DialogHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            Are you sure you want to delete this entry? This action cannot be undone.
                          </p>
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsDeleteConfirmOpen(false)
                                setDeleteTargetId(null)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={executeDelete}>
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </DialogContent>
                    </Dialog>
                  </CardHeader>
                            
                  <CardContent className="mt-2 text-sm">
                    {e.category === "food" && (
                      <div className="flex flex-row justify-between items-center">
                        <div>
                          <p className="text-muted-foreground">Meal Slot: <span className="font-semibold uppercase text-primary mt-2">{e.mealSlot}</span></p>
                          <p className="text-muted-foreground">Meal Type: <span className="font-semibold uppercase text-primary mt-2">{e.mealType}</span></p>
                        </div>

                        <div>
                          <p className="text-muted-foreground">Description: <span className="font-semibold text-xl uppercase text-primary mx-4">{e.description || "-"}</span></p>
                        </div>
                  
                      </div>
                    )}

                    {e.category === "transport" && (
                      <div className="flex flex-row justify-between items-center">
                        <div>
                          <p className="text-muted-foreground">Mode: <span className="font-semibold uppercase text-primary mt-2">{e.mode}</span></p>
                        </div>
                    
                        <div>
                          <p className="text-muted-foreground"> Distance (km) <span className="font-semibold text-xl uppercase text-primary mx-4">{(e.distanceKm ?? 0).toFixed(2)}</span></p>
                        </div>
                    
                        {e.mode === "flight" && (
                          <>
                            <div className="text-muted-foreground mt-2">Flight Type</div>
                            <div>{e.flightType ?? "-"}</div>
                          </>
                        )}
                      </div>
                    )}

                    {e.category === "home" && (
                      <div className="grid grid-cols-2 items-center">
                        <div className="text-muted-foreground">Home Type</div>
                        <div>{e.homeType}</div>
                    
                        <div className="text-muted-foreground mt-2">Occupants</div>
                        <div>{e.occupants}</div>
                    
                        <div className="text-muted-foreground mt-2">Appliances</div>
                        <div className="font-semibold text-base text-primary mt-2">
                          {e.appliances}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

              <div>
                <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" onClick={()=>setIsResetConfirmOpen(true)}>Reset Daily Data</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle>Reset Daily Data</DialogTitle></DialogHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Resetting will clear today's footprint and eco-challenges. Continue?</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={()=>setIsResetConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleConfirmReset}>Reset</Button>
                      </div>
                    </CardContent>
                  </DialogContent>
                </Dialog>
              </div>

                        {/* Show existing data cards only in form view */}
            <div className="mt-10 grid grid-cols-1 gap-6">
              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-6 w-6 text-primary" />
                    Today's Entry
                  </CardTitle>
                  <CardDescription>
                    {isLoadingToday ? "Loading today's entry..." : todayEntry ? `Date: ${todayEntry.date}` : 'No entry for today'}
                  </CardDescription>
                </CardHeader>
                {todayEntry && (
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Transport</span><span>{todayEntry.calculatedFootprint?.transport ?? '-'} kg</span></div>
                    <div className="flex justify-between"><span>Home Energy</span><span>{todayEntry.calculatedFootprint?.homeEnergy ?? '-'} kg</span></div>
                    <div className="flex justify-between"><span>Food</span><span>{todayEntry.calculatedFootprint?.food ?? '-'} kg</span></div>
                    <div className="flex justify-between font-medium"><span>Total</span><span>{todayEntry.calculatedFootprint?.total ?? '-'} kg</span></div>
                  </CardContent>
                )}
              </Card>

              <Card className="shadow-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-6 w-6 text-muted-foreground" />
                    Recent History (7 days)
                  </CardTitle>
                  <CardDescription>
                    {isLoadingHistory ? 'Loading history...' : `Entries: ${historyEntries.length}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {historyEntries.length === 0 && !isLoadingHistory && (
                      <div className="text-muted-foreground">No recent entries</div>
                    )}
                    {historyEntries.map((e) => (
                      <div key={e.id} className="flex justify-between">
                        <span>{e.date}{e.isToday ? ' (Today)' : ''}</span>
                        <span>{(e.footprint && e.footprint.total) ?? e.footprint ?? '-'} kg</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>

        )}
      </main>
    </div>
  );
};

export default TrackCarbon;