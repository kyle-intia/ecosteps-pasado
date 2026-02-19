import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Map, {
  Source,
  Layer,
  Marker,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

import { point, distance } from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import { submitLivetracking } from "../lib/api";
import { Link } from "react-router-dom";

import {
  Play,
  Square,
  History,
  Car,
  Bus,
  Bike,
  Footprints,
  Zap,
  PinIcon,
  MapPin,
} from "lucide-react";

type Category = "private" | "public" | "basic";

const transportTypes: Record<Category, string[]> = {
  private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
  public: ["tricycle", "jeep", "e-jeep", "train"],
  basic: ["walk", "bicycle"],
};

const transportIcons: Record<string, any> = {
  diesel: Car,
  electric: Zap,
  gasoline: Car,
  hybrid: Car,
  motorcycle: Car,
  tricycle: Bus,
  jeep: Bus,
  "e-jeep": Bus,
  train: Bus,
  walk: Footprints,
  bicycle: Bike,
};

const categoryColors: Record<Category, string> = {
  private: "from-blue-500 to-blue-600",
  public: "from-green-500 to-green-600",
  basic: "from-purple-500 to-purple-600",
};

interface Position {
  latitude: number;
  longitude: number;
  timestamp: Date;
  accuracy: number;
}

const UserTrackDistance: React.FC = () => {
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();
  const { toast } = useToast();

  const [category, setCategory] = useState<Category>("basic");
  const [subtype, setSubtype] = useState("walk");
  const [tracking, setTracking] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    zoom: 19,
    pitch: 50,
    bearing: 0,
  });
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionTimeRef = useRef(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setViewState((v) => ({
            ...v,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            zoom: 19,
          }));
          setLoadingLocation(false);
        },
        () => setLoadingLocation(false),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      setLoadingLocation(false);
    }
  }, []);

  const stateRef = useRef({
    positions,
    totalDistance,
    elapsedTime,
    category,
    subtype,
  });
  useEffect(() => {
    stateRef.current = {
      positions,
      totalDistance,
      elapsedTime,
      category,
      subtype,
    };
  }, [positions, totalDistance, elapsedTime, category, subtype]);

  const calcDistance = useCallback((p1: Position, p2: Position) => {
    return distance(
      point([p1.longitude, p1.latitude]),
      point([p2.longitude, p2.latitude]),
      {
        units: "kilometers",
      },
    );
  }, []);

  const formatTime = useCallback((s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
  }, []);

  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request(
          "screen",
        );
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener("release", () =>
          setWakeLockActive(false),
        );
        toast({
          title: "Screen Stay Awake",
          description: "Screen will stay on during tracking",
        });
      }
    } catch (err) {
      console.error("Wake Lock failed:", err);
    }
  }, [toast]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  const saveState = useCallback(() => {
    if (tracking && positions.length > 0) {
      localStorage.setItem(
        "tracking_state",
        JSON.stringify({
          ...stateRef.current,
          savedAt: Date.now(),
          tracking: true,
        }),
      );
    }
  }, [tracking, positions]);

  const restoreState = useCallback(() => {
    const saved = localStorage.getItem("tracking_state");
    if (!saved) return false;

    try {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.savedAt < 4 * 60 * 60 * 1000 && parsed.tracking) {
        setPositions(parsed.positions);
        setTotalDistance(parsed.totalDistance);
        setElapsedTime(parsed.elapsedTime);
        setCategory(parsed.category);
        setSubtype(parsed.subtype);
        toast({
          title: "Session Restored",
          description: `Resumed with ${parsed.positions.length} points`,
        });
        return true;
      } else localStorage.removeItem("tracking_state");
    } catch {
      localStorage.removeItem("tracking_state");
    }
    return false;
  }, [toast]);

  useEffect(() => {
    const restored = restoreState();
    if (restored && window.confirm("Continue previous tracking session?"))
      startTracking(true);
  }, [restoreState]);

  useEffect(() => {
    if (tracking) {
      const id = setInterval(saveState, 3000);
      return () => clearInterval(id);
    }
  }, [tracking, saveState]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      releaseWakeLock();
    },
    [releaseWakeLock],
  );

  const startTracking = useCallback(
    (resume = false) => {
      if (!resume) {
        setPositions([]);
        setTotalDistance(0);
        setElapsedTime(0);
      }

      setTracking(true);
      requestWakeLock();

      timerRef.current = window.setInterval(
        () => setElapsedTime((t) => t + 1),
        1000,
      );

      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const now = Date.now();
            if (now - lastPositionTimeRef.current < 1000) return;
            lastPositionTimeRef.current = now;

            const coord: Position = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: new Date(pos.timestamp),
              accuracy: pos.coords.accuracy,
            };

            setPositions((prev) => {
              const updated = [...prev, coord];
              if (prev.length > 0) {
                const dist = calcDistance(prev[prev.length - 1], coord);
                if (dist > 0.001) setTotalDistance((d) => d + dist);
              }
              return updated;
            });
          },
          (err) => {
            toast({
              title: "Location Error",
              description:
                ["Permission denied", "Position unavailable", "Timeout"][
                  err.code - 1
                ] || "GPS error",
              variant: "destructive",
            });
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
      }
    },
    [calcDistance, requestWakeLock, toast],
  );

  const stopTracking = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null)
      navigator.geolocation.clearWatch(watchIdRef.current);
    setTracking(false);
    releaseWakeLock();
    localStorage.removeItem("tracking_state");

    if (positions.length < 2 || totalDistance < 0.0000001) {
      toast({
        title: "Not Saved",
        description: "Trip too short or no movement detected.",
        variant: "destructive",
      });
      setPositions([]);
      setTotalDistance(0);
      setElapsedTime(0);
      return;
    }

    try {
      await submitLivetracking({
        category,
        subtype,
        points: positions,
        totalDistance,
        duration: elapsedTime,
      });
      toast({
        title: "Activity Saved!",
        description: "Your trip has been recorded.",
      });
      setPositions([]);
      setTotalDistance(0);
      setElapsedTime(0);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err?.message || "Could not save activity",
        variant: "destructive",
      });
    }
  }, [
    positions,
    totalDistance,
    elapsedTime,
    category,
    subtype,
    toast,
    releaseWakeLock,
  ]);

  useEffect(() => {
    if (tracking && isAutoCenter && positions.length > 0) {
      const latest = positions[positions.length - 1];
      setViewState((v) => ({
        ...v,
        latitude: latest.latitude,
        longitude: latest.longitude,
        zoom: Math.max(v.zoom, 16),
      }));
    }
  }, [positions, tracking, isAutoCenter]);

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features:
        positions.length > 0
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: positions.map((p) => [p.longitude, p.latitude]),
                },
                properties: {},
              },
            ]
          : [],
    }),
    [positions],
  );

  const avgSpeed =
    elapsedTime > 0 ? (totalDistance / (elapsedTime / 3600)).toFixed(1) : "0";
  const TransportIcon = transportIcons[subtype];

  if (isPending) return <Spinner />;
  if (loadingLocation) return <Spinner />;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900">
      <Navbar isLoggedIn={isLoggedIn} onLogout={signOut} />

      {positions.length > 0 ? (
        <Map
          {...viewState}
          onMove={(evt) => {
            setViewState(evt.viewState);
            if (isAutoCenter) setIsAutoCenter(false);
          }}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.VITE_MAPBOX_TOKEN}
          attributionControl={false}
        >
          <NavigationControl position="top-right" />

          <Source
            id="composite"
            type="vector"
            url="mapbox://mapbox.mapbox-streets-v8"
          >
            <Layer
              id="3d-buildings"
              type="fill-extrusion"
              source-layer="building"
              filter={["==", "extrude", "true"]}
              paint={{
                "fill-extrusion-color": "#aaa",
                "fill-extrusion-height": ["get", "height"],
                "fill-extrusion-base": ["get", "min_height"],
                "fill-extrusion-opacity": 0.6,
              }}
            />
          </Source>

          {geojson.features.length > 0 && (
            <Source type="geojson" data={geojson}>
              <Layer
                id="route"
                type="line"
                paint={{
                  "line-color": "#10b981",
                  "line-width": 6,
                  "line-opacity": 0.9,
                }}
              />
            </Source>
          )}

          {positions.length > 0 && (
            <Marker
              latitude={positions[positions.length - 1].latitude}
              longitude={positions[positions.length - 1].longitude}
              anchor="center"
            >
              <div className="animate-pulse">
                <TransportIcon className="w-12 h-12 text-emerald-500 drop-shadow-2xl" />
              </div>
            </Marker>
          )}
        </Map>
      ) : (
        <div
          className="flex flex-col items-center justify-center"
          style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}
        >
          <div className="p-6 bg-gray-100 rounded-full mb-6">
            <MapPin className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Ready to Track
          </h3>
          <p className="text-gray-600 text-center max-w-sm">
            Select your transport mode and press start to begin your journey
          </p>
        </div>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl transition-all duration-300 ${sheetOpen ? "h-100" : "h-32"} z-20`}
      >
        <button
          onClick={() => setSheetOpen(!sheetOpen)}
          className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-gray-300 rounded-full"
        />
        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {totalDistance.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Distance (km)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(elapsedTime)}
              </p>
              <p className="text-sm text-gray-500">Time</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgSpeed}</p>
              <p className="text-sm text-gray-500">Avg Speed (km/h)</p>
            </div>
          </div>

          {sheetOpen && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Transport Mode
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {(["private", "public", "basic"] as Category[]).map((cat) => (
                    <button
                      key={cat}
                      disabled={tracking}
                      onClick={() => {
                        setCategory(cat);
                        setSubtype(transportTypes[cat][0]);
                      }}
                      className={`py-3 rounded-2xl font-medium transition ${category === cat ? `bg-gradient-to-r ${categoryColors[cat]} text-white` : "bg-gray-100 text-gray-700"} ${tracking ? "opacity-50" : ""}`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 my-2">
                {transportTypes[category].map((sub) => {
                  const Icon = transportIcons[sub];
                  return (
                    <button
                      key={sub}
                      disabled={tracking}
                      onClick={() => setSubtype(sub)}
                      className={`py-4 rounded-2xl flex flex-col items-center gap-2 transition ${subtype === sub ? `bg-gradient-to-r ${categoryColors[category]} text-white` : "bg-gray-100"} ${tracking ? "opacity-50" : ""}`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs capitalize">
                        {sub.replace("-", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-36 left-1/2 -translate-x-1/2">
        <Button
          onClick={() => (tracking ? stopTracking() : startTracking())}
          size="lg"
          className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-3xl ${tracking ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"} text-white`}
        >
          {tracking ? (
            <Square className="w-10 h-10" />
          ) : (
            <Play className="w-10 h-10" />
          )}
        </Button>
      </div>

      <Link
        to="/track-history"
        className="absolute top-20 left-4 z-10 bg-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2"
      >
        <History className="w-5 h-5" />
        History
      </Link>

      <div className="absolute top-32 left-4 z-10">
        <Button
          onClick={() => {
            if (positions.length > 0) {
              const latest = positions[positions.length - 1];
              setViewState((v) => ({
                ...v,
                latitude: latest.latitude,
                longitude: latest.longitude,
                zoom: Math.max(v.zoom, 16),
              }));
              setIsAutoCenter(true);
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <PinIcon /> My Location
        </Button>
      </div>
    </div>
  );
};

export default UserTrackDistance;
