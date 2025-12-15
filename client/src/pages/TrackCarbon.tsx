import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Navbar } from "@/components/Navbar";
import {
  Car,
  Utensils,
  Home,
  Calculator,
  Plus,
  MoreHorizontal,
  Loader2,
  Plane,
  Globe,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { logout, updateLivetracking, getTodaysTracking, getDailyTrackingHistory, getTodayEntries, addActivityEntry, updateActivityEntry, deleteActivityEntry, submitDailyTracking, getRecommendations, clearDailyData } from "../lib/api";
import queryClient from "../config/queryClient";
import useSessions from "../hooks/useSessions";
import useAuth from "../hooks/useAuth";
import RecommendationView from "../components/RecommendationView";
import LoadingSpinner from "../components/LoadingSpinner";
import useActivityTrack from "@/hooks/useActivityTrack";
import useStravaTrack from "@/hooks/useStravaTrack";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { CardFooter } from "@/components/ui/card";
import { create } from "domain";
import { FoodAutocomplete } from "@/components/FoodAutocomplete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { NumInput } from "@/components/ui/numeric-input";
import CarbonOffset from "@/components/CarbonOffset";

type TopCategory = "transport" | "home" | "food";

type TransportGroup = "private" | "public" | "basic";

const transportTypes: Record<TransportGroup, string[]> = {
  private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
  public: ["tricycle", "jeep", "e-jeep", "train"],
  basic: ["walk", "bicycle"],
};

type BaseEntry = {
  id: string;
  category: TopCategory;
  createdAt: string;
  isTemp?: boolean;
};

type TransportEntry = BaseEntry & {
  category: "transport";
  transportGroup: TransportGroup;
  subtype: string;
  distanceKm?: number;
  contribution?: number;
};

type HomeEntry = BaseEntry & {
  category: "home";
  homeType: "large_house" | "small_house" | "apartment";
  occupants: number;
  appliances: "aircon" | "laundry" | "none";
  contribution?: number;
};

type FoodEntry = BaseEntry & {
  category: "food";
  mealSlot: "breakfast" | "lunch" | "dinner";
  mealType: "meat" | "fish" | "plant" | "dairy" | "mixed";
  description?: string;
  contribution?: number;
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

const ANIM = { initial: { opacity: 0, y: 6 }, enter: { opacity: 1, y: 0 } };

const makeId = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function RollingNumber({
  value,
  decimals = 2,
  className = "",
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState<number>(value);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef<number>(value);

  useEffect(() => {
    // Only animate when value actually changes
    if (value === fromRef.current) return;

    const start = performance.now();
    const duration = 800; // animation speed
    const from = fromRef.current;
    const to = value;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const current = from + (to - from) * ease;
      setDisplay(parseFloat(current.toFixed(decimals)));

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        fromRef.current = to;
        rafRef.current = null;
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, decimals]);

  return (
    <div className={`text-2xl md:text-3xl font-semibold ${className}`}>
      {display.toFixed(decimals)}{" "}
      <span className="text-sm font-medium text-muted-foreground">
        kg CO₂e
      </span>
    </div>
  );
}

export default function TrackCarbonDynamic() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessions, isPending, isError } = useSessions();
  const { user } = useAuth() as { user: { _id?: string } };

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // entries state (server-backed, optimistic + session persist)
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);

  // dialogs
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isSaveConfirmOpen, setIsSaveConfirmOpen] = useState(false);
  

  // editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TopCategory>("transport");

  // forms
  const [transportForm, setTransportForm] = useState<Partial<TransportEntry>>({
    transportGroup: "private",
    subtype: transportTypes.private[0],
    distanceKm: 0,
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

  // activity tracking import items
  const {
    activities,
    isLoading: isActivitiesLoading,
    isError: activitiesError,
    refetch: refetchActivities,
  } = useActivityTrack();

const {
  activities: stravaActivities,
  isLoading: isStravaLoading,
  error: stravaError,
  refetch: refetchStrava,
  isConnected,
} = useStravaTrack();


  const [isStravaImportOpen, setIsStravaImportOpen] = useState(false);
  const [stravaSelection, setStravaSelection] = useState<Record<string, boolean>>({});

  // import selection state (key -> boolean)
  const [importSelection, setImportSelection] = useState<Record<string, boolean>>({});
  // group open/closed state for accordion (optional)
  const [accordionOpen, setAccordionOpen] = useState<Record<TransportGroup, boolean>>({
    private: true,
    public: false,
    basic: false,
  });

  // footprint & recommendations
  const [footprintData, setFootprintData] = useState<FootprintResponse["data"] | null>(null);
  const [footprintId, setFootprintId] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL.replace(/\/+$/, "");

  // ---------- Server CRUD helpers ----------
  const fetchTodayEntries = async (): Promise<Entry[]> => {
    try {
      const payload = await getTodayEntries();
      return payload;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to fetch entries");
    }
  };

  const submitEntry = async (entry: Partial<Entry>): Promise<Entry> => {
    try {
      const payload = await addActivityEntry(entry);
      return payload;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to submit entry");
    }
  };

  const updateEntry = async (id: string, entry: Partial<Entry>): Promise<Entry> => {
    try {
      const payload = await updateActivityEntry(id, entry);
      return payload;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to submit entry");
    }
  };
  
  const deleteEntry = async (id: string): Promise<void> => {
    try {
      await deleteActivityEntry(id);
      console.log("Deleted entry", id);

      try {
        await updateLivetracking(id, { isImported: false });
    
      } catch (err) {
        console.warn(`Failed to mark ${id} as imported`, err);
      }
    } catch (err: any) {
      throw new Error(err?.message || "Failed to delete entry");
    }
  };

const DeleteAllEntries = async (): Promise<void> => {
  const prevEntries = entries; // backup for rollback

  // If no entries, nothing to delete
  if (!entries || entries.length === 0) {
    toast({ title: "Nothing to delete", description: "No entries found." });
    return;
  }

  try {
    // OPTIMISTIC UPDATE: clear UI immediately
    setEntries([]);
    toast({ title: "Deleting...", description: "Removing all entries." });

    // Perform all deletions in parallel
    const deletionPromises = entries.map((item) =>
      deleteEntry(item.id).catch((err) => {
        console.warn(`Failed to delete entry ${item.id}`, err);
        throw err; // important: propagate failure to trigger rollback
      })
    );

    await Promise.all(deletionPromises);

    // Clear sessionStorage after successful deletion
    sessionStorage.removeItem("carbon_entries_session");

    toast({ title: "Deleted", description: "All entries removed." });
  } catch (err: any) {
    // ROLLBACK UI
    setEntries(prevEntries);

    toast({
      title: "Error",
      description: err?.message || "Failed to delete all entries",
      variant: "destructive",
    });
  }
};


  const handleEditEntry = (id: string) => {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    setEditingId(id);
    setIsAddOpen(true);
    setActiveTab(e.category);
    if (e.category === "transport") {
      const t = e as TransportEntry;
      setTransportForm({ transportGroup: t.transportGroup, subtype: t.subtype, distanceKm: t.distanceKm || 0 });
    } else if (e.category === "home") {
      const h = e as HomeEntry;
      setHomeForm({ homeType: h.homeType, occupants: h.occupants, appliances: h.appliances });
    } else {
      const f = e as FoodEntry;
      setFoodForm({ mealSlot: f.mealSlot, mealType: f.mealType, description: f.description });
    }
  };

  // ---------- Load today's entries (server) + session persistence ----------
  useEffect(() => {
    const load = async () => {
      setIsLoadingEntries(true);
      try {
        // first attempt server fetch
        const fetched = await fetchTodayEntries();
        setEntries(fetched);
        // also save to sessionStorage for in-session persistence
        sessionStorage.setItem("carbon_entries_session", JSON.stringify(fetched));
      } catch (err: any) {
        console.error("fetch entries", err);
        toast({ title: "Failed to load entries", description: err.message || String(err), variant: "destructive" });
        // fallback: load session if available
        const saved = sessionStorage.getItem("carbon_entries_session");
        if (saved) {
          try {
            setEntries(JSON.parse(saved));
          } catch {}
        }
      } finally {
        setIsLoadingEntries(false);
      }
    };
    load();
    
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("carbon_entries_session", JSON.stringify(entries));
    } catch {}
  }, [entries]);

  // ---------- sign out ----------
  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    },
  });
  const handleSignOut = () => signOut();

  // ---------- Optimistic create helpers ----------
const optimisticCreate = async (payload: Partial<Entry>) => {
  const tempId = `temp_${makeId()}`;
  const tempEntry = {
    ...(payload as Entry),
    id: tempId,
    createdAt: new Date().toISOString(),
    isTemp: true,
  } as Entry;

  setEntries((prev) => [tempEntry, ...prev]);

  try {
    // 👇 include id in payload
    const created = await submitEntry({ ...payload, id: tempId });
    setEntries((prev) => prev.map((e) => (e.id === tempId ? created : e)));
    return created;
  } catch (err: any) {
    setEntries((prev) => prev.filter((e) => e.id !== tempId));
    throw err;
  }
};


  // create transport (manual)
  const handleCreateTransport = async () => {
    if (!transportForm.transportGroup || !transportForm.subtype) {
      toast({ title: "Invalid", description: "Choose transport group & subtype.", variant: "destructive" });
      return;
    }
    const distanceNeeded = !["walk", "bicycle"].includes(String(transportForm.subtype));
    if (distanceNeeded && (!transportForm.distanceKm || Number(transportForm.distanceKm) <= 0)) {
      toast({ title: "Invalid", description: "Enter a valid distance (km).", variant: "destructive" });
      return;
    }
    const payload: Partial<TransportEntry> = {
      category: "transport",
      transportGroup: transportForm.transportGroup as TransportGroup,
      subtype: String(transportForm.subtype),
      distanceKm: Number(transportForm.distanceKm || 0),
    };

    try {
      setIsSubmittingEntry(true);
      await optimisticCreate(payload);
      setTransportForm({ transportGroup: "private", subtype: transportTypes.private[0], distanceKm: 0 });
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add transport", variant: "destructive" });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // create home
  const handleCreateHome = async () => {

    if (hasHomeEntry) {
    toast({
      title: "Already added",
      description: "You can only add one home entry per day. Please edit the existing one instead.",
      variant: "destructive",
    });
    return;
  }

    if (!homeForm.homeType || Number(homeForm.occupants || 0) < 1) {
      toast({ title: "Invalid", description: "Choose home type & Enter a valid occupants.", variant: "destructive" });
      return;
    }
    const payload: Partial<HomeEntry> = {
      category: "home",
      homeType: homeForm.homeType as HomeEntry["homeType"],
      occupants: Number(homeForm.occupants || 0),
      appliances: homeForm.appliances as HomeEntry["appliances"],
    };
    try {
      setIsSubmittingEntry(true);
      await optimisticCreate(payload);
      setHomeForm({ homeType: "apartment", occupants: 0, appliances: "none" });
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add home", variant: "destructive" });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // create food
  const handleCreateFood = async () => {

    if (submittedFoodSlots.size >= 3) {
      toast({
        title: "All meals added",
        description: "You've already logged breakfast, lunch, and dinner for today.",
        variant: "destructive",
      });
      return;
    }

    if (!foodForm.mealSlot) {
      toast({ title: "Invalid", description: "Choose a meal slot.", variant: "destructive" });
      return;
    }
    // prevent duplicate meal slot
    const already = entries.find((e) => e.category === "food" && (e as FoodEntry).mealSlot === foodForm.mealSlot);
    if (already) {
      toast({ title: "Already submitted", description: `${foodForm.mealSlot} already submitted today.`, variant: "destructive" });
      return;
    }
    const payload: Partial<FoodEntry> = {
      category: "food",
      mealSlot: foodForm.mealSlot as FoodEntry["mealSlot"],
      mealType: foodForm.mealType as FoodEntry["mealType"],
      description: foodForm.description || "",
    };
    try {
      setIsSubmittingEntry(true);
      await optimisticCreate(payload);
      setFoodForm({ mealSlot: "breakfast", mealType: "meat", description: "" });
      setIsAddOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add food", variant: "destructive" });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // ---------- Optimistic edit ----------
  const handleSaveEdit = async () => {
    if (!editingId) return;
    const prev = entries.find((e) => e.id === editingId);
    if (!prev) return;
    let payload: Partial<Entry> = {};
    if (activeTab === "transport") {
      payload = {
        category: "transport",
        transportGroup: transportForm.transportGroup as TransportGroup,
        subtype: String(transportForm.subtype),
        distanceKm: Number(transportForm.distanceKm || 0),
      } as Partial<TransportEntry>;
    } else if (activeTab === "home") {
      payload = {
        category: "home",
        homeType: homeForm.homeType as HomeEntry["homeType"],
        occupants: Number(homeForm.occupants || 0),
        appliances: homeForm.appliances as HomeEntry["appliances"],
      } as Partial<HomeEntry>;
    } else {
      // food: ensure no duplicate slot except same entry
      const existingFoodSlot = entries.find((en) => en.category === "food" && (en as FoodEntry).mealSlot === foodForm.mealSlot);
      if (existingFoodSlot && existingFoodSlot.id !== editingId) {
        toast({ title: "Slot already used", description: `${foodForm.mealSlot} already submitted.`, variant: "destructive" });
        return;
      }
      payload = {
        category: "food",
        mealSlot: foodForm.mealSlot as FoodEntry["mealSlot"],
        mealType: foodForm.mealType as FoodEntry["mealType"],
        description: foodForm.description || "",
      } as Partial<FoodEntry>;
    }

    // optimistic update locally
    const prevEntries = entries;
    setEntries((prev) => prev.map((e) => (e.id === editingId ? { ...e, ...payload, isTemp: false } as Entry : e)));

    try {
      setIsSubmittingEntry(true);
      const updated = await updateEntry(editingId, payload);
      setEntries((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
      setEditingId(null);
      setIsAddOpen(false);
      toast({ title: "Saved", description: "Entry updated." });
    } catch (err: any) {
      // rollback
      setEntries(prevEntries);
      toast({ title: "Error", description: err.message || "Failed to update entry", variant: "destructive" });
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  // ---------- Optimistic delete ----------
  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setIsDeleteConfirmOpen(true);
  };

  const executeDelete = async () => {
    if (!deleteTargetId) return;
    const prevEntries = entries;
    // optimistic: remove immediately
    setEntries((prev) => prev.filter((e) => e.id !== deleteTargetId));
    setIsDeleteConfirmOpen(false);
    try {
      await deleteEntry(deleteTargetId);
      toast({ title: "Deleted", description: "Entry removed." });
      refetchActivities(); 
    } catch (err: any) {
      // rollback
      setEntries(prevEntries);
      toast({ title: "Error", description: err.message || "Delete failed", variant: "destructive" });
    } finally {
      setDeleteTargetId(null);
    }
  };

  // ---------- Import from live tracking (grouped accordion with checkboxes) ----------
  const importCandidates = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    return activities.map((act: any, idx: number) => {
      const subtype = String(act.subtype || "").toLowerCase();
      return {
        key: `${idx}_${act.id || makeId()}`,
        raw: act,
        subtype,
        distanceKm: Number(act.totalDistance || act.distance || 0),
        label: `${subtype} — ${Number(act.totalDistance || 0)} km`,
        createdAt: act.createdAt,
      };
    });
  }, [activities]);

const stravaCandidates = useMemo(() => {
  if (!stravaActivities || stravaActivities.length === 0) return [];
  return stravaActivities.map((act: any, idx: number) => ({
    key: `${idx}_${act.id}`,
    subtype: String(act.type || "unknown").toLowerCase(),
    distanceKm: Number((act.distance || 0) / 1000),
    createdAt: act.start_date || new Date().toISOString(),
    label: `${act.name || "Activity"} — ${Math.round((act.distance || 0) / 1000)} km`,
  }));
}, [stravaActivities]);


  // reset import selection when candidates change
  useEffect(() => {
    const s: Record<string, boolean> = {};
    importCandidates.forEach((c) => (s[c.key] = false));
    setImportSelection(s);
  }, [importCandidates.length]); // eslint-disable-line

  const toggleImportSelection = (key: string) => {
    setImportSelection((prev) => ({ ...prev, [key]: !prev[key] }));
  };


const handleAddSelectedImports = async () => {
  const selectedKeys = Object.entries(importSelection)
    .filter(([, v]) => v)
    .map(([k]) => k);

  if (selectedKeys.length === 0) {
    toast({
      title: "No selection",
      description: "Select items to import.",
      variant: "destructive",
    });
    return;
  }

  const selectedItems = importCandidates.filter((c) => selectedKeys.includes(c.key));

  // optimistic: add all selected as temp entries
  const tempEntries: Entry[] = selectedItems.map((item) => {
    const subtype = item.subtype;
    let group: TransportGroup = "basic";
    if (transportTypes.private.includes(subtype)) group = "private";
    else if (transportTypes.public.includes(subtype)) group = "public";

    return {
      id: `temp_${makeId()}`,
      category: "transport",
      createdAt: new Date().toISOString(),
      transportGroup: group,
      subtype,
      distanceKm: Number(item.distanceKm || 0),
      isTemp: true,
    } as TransportEntry;
  });

  setEntries((prev) => [...tempEntries, ...prev]);
  setIsSubmittingEntry(true);

  try {
    const createdList: Entry[] = [];

    for (const item of selectedItems) {
      const subtype = item.subtype;
      let group: TransportGroup = "basic";
      if (transportTypes.private.includes(subtype)) group = "private";
      else if (transportTypes.public.includes(subtype)) group = "public";

      const payload: Partial<TransportEntry> = {
        id: item.raw._id,
        category: "transport",
        transportGroup: group,
        subtype,
        distanceKm: Number(item.distanceKm || 0),
      };

      // ✅ Step 1: Submit the entry
      const created = await submitEntry(payload);
      createdList.push(created);

      // ✅ Step 2: Mark original as imported in DB
      try {
        await updateLivetracking(item.raw._id, { isImported: true });
      } catch (err) {
        console.warn(`Failed to mark ${item.raw._id} as imported`, err);
      }
    }

    // replace temps with created entries
    setEntries((prev) => {
      let remaining = prev.filter(
        (p) =>
          !(
            p.isTemp &&
            createdList.some(
              (c) =>
                (c as any).subtype === (p as any).subtype &&
                (c as any).distanceKm === (p as any).distanceKm
            )
          )
      );
      return [...(createdList as Entry[]), ...remaining];
    });

    toast({
      title: "Imported",
      description: `Imported ${createdList.length} activities.`,
    });
    setIsImportOpen(false);
    setIsAddOpen(false);
    refetchActivities(); 
  } catch (err: any) {
    setEntries((prev) => prev.filter((e) => !e.isTemp));
    toast({
      title: "Error",
      description: err.message || "Import failed",
      variant: "destructive",
    });
  } finally {
    setIsSubmittingEntry(false);
    const s: Record<string, boolean> = {};
    importCandidates.forEach((c) => (s[c.key] = false));
    setImportSelection(s);
  }
};


  const toggleStravaSelection = (key: string) => {
  setStravaSelection((prev) => ({ ...prev, [key]: !prev[key] }));
};

const handleAddStravaImports = async () => {
  const selectedKeys = Object.entries(stravaSelection).filter(([, v]) => v).map(([k]) => k);
  if (selectedKeys.length === 0) {
    toast({ title: "No selection", description: "Select Strava items to import.", variant: "destructive" });
    return;
  }

  const selectedItems = stravaCandidates.filter((c) => selectedKeys.includes(c.key));

  const tempEntries: Entry[] = selectedItems.map((item) => ({
    id: `temp_${makeId()}`,
    category: "transport",
    createdAt: new Date().toISOString(),
    transportGroup: "basic",
    subtype: item.subtype,
    distanceKm: item.distanceKm,
    isTemp: true,
  }));

  setEntries((prev) => [...tempEntries, ...prev]);
  setIsSubmittingEntry(true);

  try {
    const createdList: Entry[] = [];
    for (const item of selectedItems) {
      const payload: Partial<TransportEntry> = {
        id: `temp_${makeId()}`,
        category: "transport",
        transportGroup: "basic",
        subtype: item.subtype,
        distanceKm: Number(item.distanceKm || 0),
      };
      const created = await submitEntry(payload);
      createdList.push(created);
    }

    setEntries((prev) => [
      ...createdList,
      ...prev.filter((e) => !e.isTemp),
    ]);
    toast({ title: "Imported", description: `Imported ${createdList.length} Strava activities.` });
    setIsStravaImportOpen(false);
  } catch (err: any) {
    setEntries((prev) => prev.filter((e) => !e.isTemp));
    toast({ title: "Error", description: err.message || "Strava import failed", variant: "destructive" });
  } finally {
    setIsSubmittingEntry(false);
  }
};


  // ---------- Footprint calculation & recommendations ----------
  const submitFootprint = async (trackingData: any): Promise<FootprintResponse> => {
    try {
      const payload = await submitDailyTracking(trackingData);
      return payload;
    } catch (err: any) {
      throw new Error(err?.message || "Failed to submit footprint");
    }
  };

  const fetchRecommendations = async (id: string): Promise<RecommendationResponse> => {
  try {
    const payload = await getRecommendations(id);
    return payload;
  } catch (err: any) {
    throw new Error(err?.message || "Failed to fetch recommendations");
  }
  };

  const resetDailyData = async (): Promise<void> => {
    try {
      await DeleteAllEntries();
      await clearDailyData();
      refetchActivities(); 
    } catch (err: any) {
      throw new Error(err?.message || "Failed to reset daily data");
    }
  };

const handleCalculate = async () => {
  if (entries.length === 0) {
    toast({
      title: "No entries",
      description: "Add entries before calculating.",
      variant: "destructive",
    });
    return;
  }

  // ---- TRANSPORT ----
  const transportAgg: Record<string, number> = {};
  let flightsToday: "none" | "short-haul" | "long-haul" = "none";

  entries.forEach((e) => {
    if (e.category === "transport") {
      const t = e as TransportEntry;
      if (!t.subtype) return;
      transportAgg[t.subtype] = (transportAgg[t.subtype] || 0) + Number(t.distanceKm || 0);
    }
  });

  const transportModes = Object.entries(transportAgg).map(([subtype, distance]) => ({
    id: subtype,
    distance: Number(distance.toFixed(2)),
  }));

  const distances = Object.fromEntries(transportModes.map((m) => [m.id, m.distance]));

  // ---- HOME ----
  const homeEntries = entries.filter((e) => e.category === "home") as HomeEntry[];
  let homeEnergyPayload = {
    homeType: "small_house",
    occupants: 0,
    appliances: ["none"] as any[],
  };

  if (homeEntries.length > 0) {
    const latest = homeEntries.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
    )[0];
    homeEnergyPayload = {
      homeType: latest.homeType,
      occupants: latest.occupants,
      appliances: [latest.appliances],
    };
  }

  // ---- FOOD ----
  const foodEntries = entries.filter((e) => e.category === "food") as FoodEntry[];
  const foodPayload: any = {
    breakfast: "skipped",
    lunch: "skipped",
    dinner: "skipped",
    breakfastFood: "",
    lunchFood: "",
    dinnerFood: "",
  };

  if (foodEntries.length > 0) {
    const latestBySlot: Record<string, FoodEntry> = {};
    foodEntries.forEach((f) => {
      const prev = latestBySlot[f.mealSlot];
      if (!prev || new Date(f.createdAt) > new Date(prev.createdAt))
        latestBySlot[f.mealSlot] = f;
    });

    if (latestBySlot.breakfast) {
      foodPayload.breakfast = latestBySlot.breakfast.mealType;
      foodPayload.breakfastFood = latestBySlot.breakfast.description || "";
    }
    if (latestBySlot.lunch) {
      foodPayload.lunch = latestBySlot.lunch.mealType;
      foodPayload.lunchFood = latestBySlot.lunch.description || "";
    }
    if (latestBySlot.dinner) {
      foodPayload.dinner = latestBySlot.dinner.mealType;
      foodPayload.dinnerFood = latestBySlot.dinner.description || "";
    }
  }

  // ---- FINAL PAYLOAD ----
  const payload = {
    transport: { modes: transportModes, distances },
    flightsToday: flightsToday === "none" ? "none" : flightsToday,
    homeEnergy: homeEnergyPayload,
    food: foodPayload,
    rawEntries: entries,
  };

  // ---- SUBMIT + UPDATE ----
  try {
    setLoadingStatus("loading");
    setErrorMessage(null);

    const res = await submitFootprint(payload);

    setFootprintData(res.data);
    setFootprintId(res.data.footprintId);
    localStorage.setItem("current_footprint_data", JSON.stringify(res.data));

    // ✅ Trigger <RollingNumber> animation by updating todayEntry
    setTodayEntry((prev) => ({
      ...(prev || {}),
      calculatedFootprint: {
        ...(prev?.calculatedFootprint || {}),
        ...res.data.calculatedFootprint,
      },
    }));

    setLoadingStatus("success");
  } catch (err: any) {
    console.error(err);
    setLoadingStatus("error");
    setErrorMessage(err.message || "Failed to calculate footprint");

    toast({
      title: "Error",
      description: err.message || "Calculation failed",
      variant: "destructive",
    });
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

const handleGetRecommendations = async () => {
  const id = footprintId || footprintData?.footprintId;
  if (!id) {
    toast({ title: "No footprint", description: "Calculate first.", variant: "destructive" });
    return;
  }

  try {
    setLoadingStatus("loading");
    const rec = await fetchRecommendations(id);

    setRecommendations(rec.data.recommendations || []);
    localStorage.setItem("current_recommendations", JSON.stringify(rec.data.recommendations));

    setLoadingStatus("success");
    toast({
      title: "Recommendations ready",
      description: `Generated ${rec.data.recommendations.length} recommendations.`,
    });
  } catch (err: any) {
    setLoadingStatus("error");
    setErrorMessage(err.message || "Failed to fetch recommendations");
    toast({
      title: "Error",
      description: err.message || "Failed to fetch recommendations",
      variant: "destructive",
    });
  }
};

useEffect(() => {
  const savedRecs = localStorage.getItem("current_recommendations");
  const savedFootprint = localStorage.getItem("current_footprint_data");

  if (savedRecs) setRecommendations(JSON.parse(savedRecs));
  if (savedFootprint) setFootprintData(JSON.parse(savedFootprint));
}, []);


const handleConfirmReset = async () => {
  try {
    await resetDailyData();
    setFootprintData(null);
    setFootprintId(null);
    setTodayEntry(null)
    setRecommendations([]);
    setLoadingStatus("idle");
    localStorage.removeItem("current_footprint_data");
    localStorage.removeItem("current_recommendations");
    toast({ title: "Reset", description: "Daily data reset. You can add new entries." });
  } catch (err: any) {
    toast({ title: "Reset failed", description: err.message || "Reset failed", variant: "destructive" });
  }
};


  // ---------- Totals ----------
  const totals = useMemo(() => {
    if (footprintData) {
      return {
        transport: Number(footprintData.calculatedFootprint.transport || 0),
        homeEnergy: Number(footprintData.calculatedFootprint.homeEnergy || 0),
        food: Number(footprintData.calculatedFootprint.food || 0),
        total: Number(footprintData.calculatedFootprint.total || 0),
      };
    }
    // fallback to entry contributions if available
    const t = entries.reduce((s, e) => s + (e.category === "transport" ? (e as TransportEntry).contribution || 0 : 0), 0);
    const h = entries.reduce((s, e) => s + (e.category === "home" ? (e as HomeEntry).contribution || 0 : 0), 0);
    const f = entries.reduce((s, e) => s + (e.category === "food" ? (e as FoodEntry).contribution || 0 : 0), 0);
    return { transport: t, homeEnergy: h, food: f, total: t + h + f };
  }, [footprintData, entries]);


  const hasHomeEntry = useMemo(
    () => entries.some((e) => e.category === "home"),
    [entries]
  );

  const submittedFoodSlots = useMemo(() => {
    const setSlots = new Set<string>();
    entries.forEach((e) => {
      if (e.category === "food") setSlots.add((e as FoodEntry).mealSlot);
    });
    return setSlots;
  }, [entries]);

  const allFoodSlotsTaken = useMemo(
    () => submittedFoodSlots.size >= 3,
    [submittedFoodSlots]
  );

  if (isPending || isLoadingEntries) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={!!user} onLogout={handleSignOut} />

      {/* Sticky summary header */}
      {recommendations.length === 0 && (
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
          <div className="flex flex-col-reverse sm:flex-row md:flex-row items-center justify-between gap-5">
            <h1 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Calculator className="w-6 h-6 text-primary" />
              Track Your Daily Carbon
            </h1>
            <div className="flex gap-2">
              <ConfirmDialog
                trigger={
                  <Button variant="outline">
                    Reset Daily
                  </Button>
                }
                title="Reset Daily?"
                description="Are you sure you want to reset daily data? This action cannot be undone."
                confirmText="Yes, Reset"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={handleConfirmReset}
              />

              <ConfirmDialog
                trigger={
                  <Button
                    variant="eco"
                    disabled={submittedFoodSlots.size < 3 || loadingStatus === "loading"}
                  >
                    {loadingStatus === "loading" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Getting Recommendations...
                      </>
                    ) : (
                      "Get AI Recommendations"
                    )}
                  </Button>
                }
                title="Get AI Recommendations?"
                description="Are you sure you want to generate AI recommendations?"
                confirmText="Yes, Generate"
                cancelText="Cancel"
                onConfirm={handleGetRecommendations}
              />
            </div>
          </div>

          {/* === Sticky Summary Header === */}
          <Card className="border border-border/40 bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 backdrop-blur-sm shadow-sm">
            <CardContent className="py-4 space-y-4">
              {/* Top Row — Total Footprint */}
              <div className="flex flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-6 h-6 text-indigo-500" />
                  <span className="font-semibold text-lg text-foreground/80">Total Footprint</span>
                </div>
                <div className="text-3xl font-bold text-foreground flex items-baseline">
                  <RollingNumber
                    value={
                      (todayEntry?.calculatedFootprint?.transport || 0) +
                      (todayEntry?.calculatedFootprint?.homeEnergy || 0) +
                      (todayEntry?.calculatedFootprint?.food || 0)
                    }
                  />
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Bottom Row — Add Entry & Tabs */}
            <div className="flex flex-row items-start justify-between gap-4 px-2">

              {/* === Left: Add Entry Dialog === */}
              <div className="flex items-center gap-3">
                <Dialog
                  open={isAddOpen}
                  onOpenChange={(v) => {
                    setIsAddOpen(v);
                    if (!v) setEditingId(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      onClick={() => {
                        if (recommendations.length > 0) {
                          toast({
                            title: "Action disabled",
                            description: "You already have recommendations. Reset daily to add new entries.",
                            variant: "destructive",
                          });
                          return;
                        }
                        setEditingId(null);
                        setActiveTab("transport");
                      }}
                      variant="default"
                      disabled={recommendations.length > 0}
                    >
                      <Plus className="w-5 h-5 mr-2" /> 
                      <span className="hidden sm:inline">
                        {editingId ? "Edit Entry" : "Add Entry"}
                      </span>
                    </Button>

                  </DialogTrigger>

                  {/* === Add Entry Modal === */}
                  <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold tracking-tight">
                        {editingId ? "Edit Entry" : "Add New Entry"}
                      </DialogTitle>
                    </DialogHeader>

                    {/* Tabs */}
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TopCategory)}>
                      <TabsList className="grid w-full grid-cols-3 bg-muted/40 rounded-md mb-4">
                        <TabsTrigger value="transport"> Transport</TabsTrigger>
                        <TabsTrigger value="home"> Home</TabsTrigger>
                        <TabsTrigger value="food"> Food</TabsTrigger>
                      </TabsList>

                      {/* === TRANSPORT FORM === */}
                      <TabsContent value="transport">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label className="required">Group</Label>
                            <Select
                              value={transportForm.transportGroup}
                              onValueChange={(v) => {
                                setTransportForm((prev) => ({
                                  ...prev,
                                  transportGroup: v as TransportGroup,
                                  subtype: transportTypes[v as TransportGroup][0],
                                }));
                              }}
                            >
                              <SelectTrigger><SelectValue placeholder="Choose group" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="private">Private</SelectItem>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="required">Subtype</Label>
                            <Select
                              value={transportForm.subtype}
                              onValueChange={(v) => setTransportForm(prev => ({ ...prev, subtype: v }))}
                            >
                              <SelectTrigger><SelectValue placeholder="Choose subtype" /></SelectTrigger>
                              <SelectContent>
                                {transportTypes[(transportForm.transportGroup || "private") as TransportGroup].map((st) => (
                                  <SelectItem key={st} value={st}>{st}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="required">Distance (km)</Label>
                            <NumInput
                              type="number"
                              placeholder="km"
                              value={transportForm.distanceKm ?? ""}
                              onChange={(e) =>
                                setTransportForm(prev => ({
                                  ...prev,
                                  distanceKm: e.target.value === "" ? null : Number(e.target.value),
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            onClick={() => {
                              if (editingId) setIsSaveConfirmOpen(true);
                              else handleCreateTransport();
                            }}
                            disabled={isSubmittingEntry}
                          >
                            {editingId ? "Save Transport" : "Add Transport"}
                          </Button>
                          <Button variant="ghost" onClick={() => setIsImportOpen(true)}>
                            Import from Live Tracking
                          </Button>
                          <Button variant="ghost" onClick={() => setIsStravaImportOpen(true)}>
                            Import from Strava
                          </Button>
                        </div>
                      </TabsContent>

                      {/* === HOME FORM === */}
                      <TabsContent value="home">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label className="required">Home Type</Label>
                            <Select
                              value={homeForm.homeType}
                              onValueChange={(v) => setHomeForm(prev => ({ ...prev, homeType: v as any }))}
                              disabled={hasHomeEntry}
                            >
                              <SelectTrigger><SelectValue placeholder="Choose home" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="large_house">Large House</SelectItem>
                                <SelectItem value="small_house">Small House</SelectItem>
                                <SelectItem value="apartment">Apartment / Condo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="required">Occupants</Label>
                            <NumInput
                              type="number"
                              placeholder="Occupants (including yourself)"
                              min={1}
                              value={homeForm.occupants ?? ""}
                              onChange={(e) =>
                                setHomeForm(prev => ({
                                  ...prev,
                                  occupants: e.target.value === "" ? null : Number(e.target.value),
                                }))
                              }
                              disabled={hasHomeEntry}
                            />
                          </div>

                          <div>
                            <Label className="required">Appliances</Label>
                            <Select
                              value={homeForm.appliances as any}
                              onValueChange={(v) => setHomeForm(prev => ({ ...prev, appliances: v as any }))}
                              disabled={hasHomeEntry}
                            >
                              <SelectTrigger><SelectValue placeholder="Choose appliance" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="aircon">Aircon</SelectItem>
                                <SelectItem value="laundry">Laundry</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            onClick={() => {
                              if (editingId) setIsSaveConfirmOpen(true);
                              else handleCreateHome();
                            }}
                            disabled={isSubmittingEntry || hasHomeEntry}
                          >
                            {editingId ? "Save Home" : "Add Home"}
                          </Button>
                          {hasHomeEntry && (
                            <p className="text-xs text-muted-foreground mt-2">
                              You can only add one home entry per day. Use “Edit” to update it.
                            </p>
                          )}
                        </div>
                      </TabsContent>

                      {/* === FOOD FORM === */}
                      <TabsContent value="food">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <Label className="required">Meal Slot</Label>
                            <Select
                              value={foodForm.mealSlot}
                              onValueChange={(v) => setFoodForm(prev => ({ ...prev, mealSlot: v as any }))}
                            >
                              <SelectTrigger><SelectValue placeholder="Choose slot" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="breakfast" disabled={submittedFoodSlots.has("breakfast")}>Breakfast {submittedFoodSlots.has("breakfast") ? "(Submitted)" : ""}</SelectItem>
                                <SelectItem value="lunch" disabled={submittedFoodSlots.has("lunch")}>Lunch {submittedFoodSlots.has("lunch") ? "(Submitted)" : ""}</SelectItem>
                                <SelectItem value="dinner" disabled={submittedFoodSlots.has("dinner")}>Dinner {submittedFoodSlots.has("dinner") ? "(Submitted)" : ""}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label className="required">Type</Label>
                            <Select
                              value={foodForm.mealType}
                              onValueChange={(v) => setFoodForm(prev => ({ ...prev, mealType: v as any }))}
                              disabled={allFoodSlotsTaken} 
                            >
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
                            <div className="flex flex-col">
                            <Label>Description </Label>
                            <span className="text-xs text-muted-foreground my-2">(Optional - For better Recommendations)</span>
                            </div>
                            <FoodAutocomplete
                              category={foodForm.mealType as any}
                              value={foodForm.description}
                              disabled={allFoodSlotsTaken}
                              onChange={(v) => setFoodForm(prev => ({ ...prev, description: v }))}
                            />
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            onClick={() => {
                              if (editingId) setIsSaveConfirmOpen(true);
                              else handleCreateFood();
                            }}
                            disabled={isSubmittingEntry || allFoodSlotsTaken}
                          >
                            {editingId ? "Save Food" : "Add Food"}
                          </Button>
                          {allFoodSlotsTaken && (
                            <p className="text-xs text-muted-foreground mt-2">
                              You’ve already logged all three meals for today.
                            </p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                {/* === Save Confirm Dialog === */}
                <Dialog open={isSaveConfirmOpen} onOpenChange={setIsSaveConfirmOpen}>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle>Save changes?</DialogTitle></DialogHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">Save edits to this entry?</p>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsSaveConfirmOpen(false)}>Cancel</Button>
                        <Button onClick={async () => {
                          setIsSaveConfirmOpen(false);
                          await handleSaveEdit();
                        }}>Save</Button>
                      </div>
                    </CardContent>
                  </DialogContent>
                </Dialog>
              </div>

              {/* === Right: Quick Actions === */}
              <div className="flex flex-wrap gap-2 md:gap-3">
                <Button onClick={handleCalculate} disabled={loadingStatus === "loading"} variant="hero">
                  Calculate
                  <span className="hidden sm:inline">
                   Footprint
                  </span>
                </Button>
              </div>
            </div>


            </CardContent>
          </Card>

        </div>
      </div>
      )}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recommendations inline */}
        {recommendations && recommendations.length > 0 ? (
          <RecommendationView recommendations={recommendations} footprintData={footprintData} onRetry={async () => {
            const id = footprintId || (footprintData as any)?.footprintId;
            if (!id) return;
            try {
              setLoadingStatus("loading");
              const rec = await fetchRecommendations(id);
              setRecommendations(rec.data.recommendations || []);
              setLoadingStatus("success");
            } catch (err:any) {
              setLoadingStatus("error");
            }
          }} />
        ) : (
          <>

            {/* Category Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: "Transport",
                  icon: <Car className="h-5 w-5 text-blue-500" />,
                  value: todayEntry?.calculatedFootprint?.transport || 0,
                  count: entries.filter(e => e.category === "transport").length,
                  gradient: "from-blue-500/10 to-blue-500/5",
                },
                {
                  title: "Home",
                  icon: <Home className="h-5 w-5 text-emerald-500" />,
                  value: todayEntry?.calculatedFootprint?.homeEnergy || 0,
                  count: entries.filter(e => e.category === "home").length,
                  gradient: "from-emerald-500/10 to-emerald-500/5",
                },
                {
                  title: "Food",
                  icon: <Utensils className="h-5 w-5 text-amber-500" />,
                  value: todayEntry?.calculatedFootprint?.food || 0,
                  count: entries.filter(e => e.category === "food").length,
                  extra: `${submittedFoodSlots.has("breakfast") ? "Breakfast ✓" : "Breakfast •"} 
                          ${submittedFoodSlots.has("lunch") ? "Lunch ✓" : "Lunch •"} 
                          ${submittedFoodSlots.has("dinner") ? "Dinner ✓" : "Dinner •"}`,
                  gradient: "from-amber-500/10 to-amber-500/5",
                },
              ].map((card, i) => (
                <Card
                  key={i}
                  className={`relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br ${card.gradient} 
                              backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300`}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground/90">
                      {card.icon}
                      <span>{card.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold tracking-tight text-foreground">
                      <RollingNumber value={card.value} />
                    </div>
                    <CardDescription className="mt-3 text-sm text-muted-foreground flex flex-col gap-1">
                      <span>{card.count} items</span>
                      {card.extra && (
                        <span className="text-xs text-muted-foreground/80">{card.extra}</span>
                      )}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="default" className="mb-5">
                  Show Daily Carbon Offset
                </Button>
              </DialogTrigger>
            
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Today's Carbon Offset</DialogTitle>
                  <DialogDescription>
                    Your daily carbon footprint details.
                  </DialogDescription>
                </DialogHeader>
            
                <CarbonOffset
                  dailyCarbon={
                    (todayEntry?.calculatedFootprint?.transport || 0) +
                    (todayEntry?.calculatedFootprint?.homeEnergy || 0) +
                    (todayEntry?.calculatedFootprint?.food || 0)
                  }
                />
              </DialogContent>
            </Dialog> */}

            {/* Entries grouped by category */}
            <div className="space-y-10">
              {/* Section Builder */}
              {[
                {
                  key: "transport",
                  icon: <Car className="h-5 w-5 text-blue-500" />,
                  title: "Transport",
                  noDataText: "No transport entries yet.",
                  color: "blue",
                  renderDetails: (e: TransportEntry) => (
                    <>
                      <div><span className="font-medium text-muted-foreground/70">Group:</span> {e.transportGroup}</div>
                      <div><span className="font-medium text-muted-foreground/70">Subtype:</span> {e.subtype}</div>
                      <div><span className="font-medium text-muted-foreground/70">Distance:</span> {e.distanceKm ?? 0} km</div>
                    </>
                  ),
                },
                {
                  key: "home",
                  icon: <Home className="h-5 w-5 text-emerald-500" />,
                  title: "Home Energy",
                  noDataText: "No home entries yet.",
                  color: "emerald",
                  renderDetails: (e: HomeEntry) => (
                    <>
                      <div><span className="font-medium text-muted-foreground/70">Type:</span> {e.homeType}</div>
                      <div><span className="font-medium text-muted-foreground/70">Occupants:</span> {e.occupants}</div>
                      <div><span className="font-medium text-muted-foreground/70">Appliances:</span> {e.appliances}</div>
                    </>
                  ),
                },
                {
                  key: "food",
                  icon: <Utensils className="h-5 w-5 text-amber-500" />,
                  title: "Food",
                  noDataText: "No food entries yet.",
                  color: "amber",
                  renderDetails: (e: FoodEntry) => (
                    <>
                      <div><span className="font-medium text-muted-foreground/70">Slot:</span> {e.mealSlot}</div>
                      <div><span className="font-medium text-muted-foreground/70">Type:</span> {e.mealType}</div>
                      <div><span className="font-medium text-muted-foreground/70">Description:</span> {e.description || "-"}</div>
                    </>
                  ),
                },
              ].map((section) => {
                const filtered = entries.filter(e => e.category === section.key);
              
                return (
                  <div key={section.key}>
                    {/* Section Header */}
                    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                      {section.icon}
                      <span className="text-foreground/90">{section.title}</span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
                      </span>
                    </h3>

                    {/* Empty State */}
                    {filtered.length === 0 ? (
                      <Card className="border border-dashed border-border/40 bg-muted/20">
                        <CardContent>
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {section.noDataText}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filtered.map((e) => (
                        <motion.div key={e.id} initial="initial" animate="enter" variants={ANIM}>
                          <Card
                            className={`relative overflow-hidden mb-3 border border-border/50 
                                       rounded-xl bg-gradient-to-br from-${section.color}-500/10 to-${section.color}-500/5 
                                       shadow-sm hover:shadow-md transition-all duration-300
                                       ${e.isTemp ? "opacity-80 animate-pulse" : ""}`}
                          >
                            {/* Header */}
                            <CardHeader className="flex flex-row justify-between items-start pb-3">
                              <div>
                                <CardTitle className="font-medium text-foreground/90 flex flex-wrap items-center gap-2">
                                  {section.key === "food" ? (
                                    <>
                                      <span className="capitalize">{(e as FoodEntry).mealSlot}</span> — {(e as FoodEntry).mealType}
                                    </>
                                  ) : section.key === "home" ? (
                                    <>{(e as HomeEntry).homeType}</>
                                  ) : (
                                    <>
                                      {(e as TransportEntry).transportGroup} — {(e as TransportEntry).subtype}
                                    </>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-xs text-muted-foreground mt-1">
                                  {new Date(e.createdAt).toLocaleString()}
                                </CardDescription>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="hover:bg-muted/50">
                                    <MoreHorizontal />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditEntry((e as Entry).id)}>Edit</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => confirmDelete((e as Entry).id)}>Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </CardHeader>

                            {/* Content */}
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-foreground/80">
                                {section.renderDetails(e as any)}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>


            {/* Import modal (grouped & collapsible) */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader><DialogTitle>Import from Live Tracking</DialogTitle></DialogHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Select activities to import (1:1). Each item preserves subtype & distance.</p>
                  {importCandidates.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No live activities found.</div>
                  ) : (
                    <div className="space-y-3">
                      <Accordion type="single" collapsible>
                        {(Object.keys(transportTypes) as TransportGroup[]).map((group) => {
                          // ✅ Filter for both transport type and today's date
                          const items = importCandidates
                            .filter((c) => transportTypes[group].includes(c.subtype))
                            .filter((c) => {
                              const createdDate = new Date(c.createdAt).toLocaleDateString('en-CA', {
                                timeZone: 'Asia/Manila',
                              });
                              
                              const todayDate = new Date().toLocaleDateString('en-CA', {
                                timeZone: 'Asia/Manila',
                              });
                              
                              return createdDate === todayDate;
                            });
                          
                          return (
                            <AccordionItem key={group} value={group}>
                              <AccordionTrigger className="capitalize font-medium">
                                {group} transport ({items.length})
                              </AccordionTrigger>
                              <AccordionContent>
                                {items.length === 0 ? (
                                  <div className="text-sm text-muted-foreground p-3">No items in this group.</div>
                                ) : (
                                  <div className="space-y-2 p-2">
                                    {items.map((c) => (
                                      <label
                                        key={c.key}
                                        className="flex items-center gap-3 p-2 rounded hover:bg-muted"
                                      >
                                        <Checkbox
                                          checked={!!importSelection[c.key]}
                                          onCheckedChange={() => toggleImportSelection(c.key)}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium capitalize">{c.subtype}</div>
                                          <div className="text-xs text-muted-foreground">
                                            distance: {c.distanceKm} km
                                          </div>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {new Date(c.createdAt).toLocaleDateString()}
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}
                      </Accordion>
                    </div>
                  )}

                </CardContent>

                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSelectedImports} disabled={isSubmittingEntry}>
                    {isSubmittingEntry ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importing...</> : "Add Selected"}
                  </Button>
                </CardFooter>
              </DialogContent>
            </Dialog>

            {/* Strava Import Modal */}
            <Dialog open={isStravaImportOpen} onOpenChange={setIsStravaImportOpen}>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Import from Strava</DialogTitle>
                </DialogHeader>
                  <CardContent className="space-y-4">
                    {!isConnected ? (
                      <>
                        <p className="text-sm text-muted-foreground">
                          You are not linked to Strava yet.
                        </p>
                        <Button
                          variant="eco"
                          onClick={() => window.open(`${API_BASE}/api/strava/auth`, "_blank")}
                        >
                          Link Strava Account
                        </Button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          ✅ Linked to Strava
                        </div>
                    
                        {isStravaLoading ? (
                          <div className="text-sm text-muted-foreground">Loading activities...</div>
                        ) : stravaCandidates.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No recent Strava activities found.</div>
                        ) : (
                          <div className="space-y-2 p-2">
                            {stravaCandidates.map((c) => (
                              <label key={c.key} className="flex items-center gap-3 p-2 rounded hover:bg-muted">
                                <Checkbox
                                  checked={!!stravaSelection[c.key]}
                                  onCheckedChange={() => toggleStravaSelection(c.key)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium capitalize">{c.label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(c.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                  
                  
                <CardFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsStravaImportOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddStravaImports} disabled={isSubmittingEntry}>
                    {isSubmittingEntry ? "Importing..." : "Add Selected"}
                  </Button>
                </CardFooter>
              </DialogContent>
            </Dialog>


            {/* Delete confirm */}
            <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader><DialogTitle>Delete Entry?</DialogTitle></DialogHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Are you sure you want to delete this entry? This cannot be undone.</p>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={executeDelete}>Delete</Button>
                  </div>
                </CardContent>
              </DialogContent>
            </Dialog>
          </>
        )}

        <div className="mt-10 grid grid-cols-1 gap-6">
          <Card
            className="relative overflow-hidden rounded-xl border border-border/50 
                       bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 
                       backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground/90">
                <Plane className="h-6 w-6 text-indigo-500" />
                Recent History (7 days)
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {isLoadingHistory
                  ? "Loading history..."
                  : `Entries: ${historyEntries.length}`}
              </CardDescription>
            </CardHeader>
                
            <CardContent>
              {/* Empty State */}
              {historyEntries.length === 0 && !isLoadingHistory ? (
                <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border/40 rounded-md bg-muted/20">
                  No recent entries
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {historyEntries.map((e, i) => (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex justify-between items-center rounded-lg px-3 py-2 
                                 hover:bg-muted/40 transition-colors duration-200"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground/90">
                          {e.date}
                          {e.isToday && (
                            <span className="ml-1 text-xs text-indigo-500 font-medium">
                              (Today)
                            </span>
                          )}
                        </span>
                        {e.label && (
                          <span className="text-xs text-muted-foreground">{e.label}</span>
                        )}
                      </div>
                      <div className="text-right font-semibold text-foreground/80">
                        {(e.footprint?.total ?? e.footprint ?? "-")}{" "}
                        <span className="text-xs text-muted-foreground">kg CO₂e</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
            
      </main>
    </div>
  );
}


