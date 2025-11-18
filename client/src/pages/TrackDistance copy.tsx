"use client";

import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
} from "react-leaflet";
import { useState, useEffect, useRef, useCallback } from "react";
import { point, distance } from "@turf/turf";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Navbar } from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import { 
  Play, 
  Square, 
  Navigation, 
  Clock, 
  Route,
  Car,
  Bus,
  Bike,
  Footprints,
  Zap,
  Fuel,
  MapPin
} from "lucide-react";

import { submitLivetracking } from "../lib/api";

type Category = "private" | "public" | "basic";

const transportTypes = {
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

const UserTrackDistance = () => {
  const { isPending, isLoggedIn } = useSessionStatus();
  const { signOut } = useSignOut();
  const { toast } = useToast();

  const [category, setCategory] = useState<Category>("basic");
  const [subtype, setSubtype] = useState("walk");
  const [tracking, setTracking] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastPositionTimeRef = useRef(0);

  const calcDistance = useCallback((p1: any, p2: any) => {
    const point1 = point([p1.longitude, p1.latitude]);
    const point2 = point([p2.longitude, p2.latitude]);
    return distance(point1, point2, { units: "kilometers" });
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startTracking = useCallback(() => {
    setPositions([]);
    setTotalDistance(0);
    setElapsedTime(0);
    setTracking(true);

    timerRef.current = window.setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const currentTime = Date.now();
          if (currentTime - lastPositionTimeRef.current > 1000) {
            lastPositionTimeRef.current = currentTime;

            const newCoord = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              timestamp: new Date(pos.timestamp),
            };

            setPositions((prev) => {
              if (prev.length > 0) {
                const dist = calcDistance(prev[prev.length - 1], newCoord);
                setTotalDistance((d) => d + dist);
              }
              return [...prev, newCoord];
            });
          }
        },
        (err) => {
          const errorMsgs: { [key: number]: string } = {
            1: "⛔ Location permission denied.",
            2: "⚠️ Position unavailable.",
            3: "⏱️ Request timed out.",
          };

          toast({
            title: "Location Error",
            description: errorMsgs[err.code] || "⚠️ GPS error.",
            variant: "destructive",
          });
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "⚠️ Geolocation not supported in this browser.",
        variant: "destructive",
      });
    }
  }, [calcDistance, toast]);

const stopTracking = useCallback(async () => {
  if (timerRef.current) clearInterval(timerRef.current);
  if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
  setTracking(false);

  if (positions.length < 2) {
    toast({
      title: "Tracking Too Short",
      description: "Not enough data to save activity.",
      variant: "destructive",
    });

    setPositions([]);
    setTotalDistance(0);
    setElapsedTime(0);
    return;
  }

  if (totalDistance < 0.001) {
    toast({
      title: "Distance Too Short",
      description: `Tracked distance was only ${totalDistance.toFixed(2)} km. Minimum is 1 m.`,
      variant: "destructive",
    });

    setPositions([]);
    setTotalDistance(0);
    setElapsedTime(0);
    return;
  }

  try {
    // Use your API helper instead of fetch
    const data = await submitLivetracking({
      category,
      subtype,
      points: positions,
      totalDistance,
      duration: elapsedTime,
    });

    toast({
      title: "Activity Saved",
      description: "Your tracking data has been saved!",
      variant: "success",
    });

    setPositions([]);
    setTotalDistance(0);
    setElapsedTime(0);
  } catch (err: any) {
    console.error(err);
    toast({
      title: "Save Failed",
      description: err?.message || "Something went wrong saving your activity.",
      variant: "destructive",
    });
  }
}, [positions, totalDistance, elapsedTime, category, subtype, toast]);


  const handleToggleTracking = () => {
    tracking ? stopTracking() : startTracking();
  };

  const handleSignOut = () => signOut();

  if (isPending) return <Spinner />;

  const TransportIcon = transportIcons[subtype];
  const avgSpeed = elapsedTime > 0 ? (totalDistance / (elapsedTime / 3600)) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Live Activity Tracking
          </h1>
          <p className="text-gray-600">
            Track your journey in real-time and contribute to a greener planet
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Controls & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Transport Selection Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Car className="w-5 h-5 text-gray-700" />
                Transport Mode
              </h2>
              
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(transportTypes) as Category[]).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setCategory(cat);
                          setSubtype(transportTypes[cat][0]);
                        }}
                        disabled={tracking}
                        className={`
                          py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200
                          ${category === cat 
                            ? `bg-gradient-to-r ${categoryColors[cat]} text-white shadow-md` 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                          ${tracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subtype Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {transportTypes[category].map((sub) => {
                      const Icon = transportIcons[sub];
                      return (
                        <button
                          key={sub}
                          onClick={() => setSubtype(sub)}
                          disabled={tracking}
                          className={`
                            py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200
                            flex items-center justify-center gap-2
                            ${subtype === sub 
                              ? `bg-gradient-to-r ${categoryColors[category]} text-white shadow-md` 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }
                            ${tracking ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          `}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Start/Stop Button */}
              <Button
                onClick={handleToggleTracking}
                className={`
                  w-full mt-6 py-6 text-lg font-semibold rounded-xl transition-all duration-300
                  ${tracking 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30'
                  }
                  text-white transform hover:scale-105
                `}
              >
                {tracking ? (
                  <>
                    <Square className="w-5 h-5 mr-2 inline" fill="currentColor" />
                    Stop & Save Activity
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2 inline" fill="currentColor" />
                    Start Tracking
                  </>
                )}
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {/* Distance Card */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Route className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Distance</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {totalDistance.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 mt-1">kilometers</p>
              </div>

              {/* Time Card */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-purple-100 rounded-xl">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">Duration</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatTime(elapsedTime)}
                </p>
                <p className="text-sm text-gray-500 mt-1">time elapsed</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Avg Speed</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {avgSpeed.toFixed(1)} km/h
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Data Points</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {positions.length}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className={`text-sm font-semibold flex items-center gap-1.5 ${tracking ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${tracking ? 'bg-green-600 animate-pulse' : 'bg-gray-400'}`}></span>
                    {tracking ? 'Tracking' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
              {positions.length > 0 ? (
                <div className="relative z-10">
                  <MapContainer
                    center={[positions[0].latitude, positions[0].longitude]}
                    zoom={16}
                    style={{ height: "calc(100vh - 200px)", minHeight: "500px", zIndex: 10 }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="© OpenStreetMap contributors"
                    />
                    <RecenterMap
                      position={[
                        positions[positions.length - 1].latitude,
                        positions[positions.length - 1].longitude,
                      ]}
                    />
                    <Polyline
                      positions={positions.map((p) => [p.latitude, p.longitude])}
                      pathOptions={{ color: "#3b82f6", weight: 4 }}
                    />
                    <Marker
                      position={[
                        positions[positions.length - 1].latitude,
                        positions[positions.length - 1].longitude,
                      ]}
                    />
                  </MapContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
                  <div className="p-6 bg-gray-100 rounded-full mb-6">
                    <MapPin className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Ready to Track
                  </h3>
                  <p className="text-gray-600 text-center max-w-sm">
                    Select your transport mode and press "Start Tracking" to begin your journey
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const RecenterMap = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  useEffect(() => {
    if (isAutoCenter) {
      map.setView(position, map.getZoom());
    }
  }, [position, isAutoCenter, map]);

  return (
    <div className="absolute top-4 right-4 z-[1000]">
      <button
        onClick={() => {
          setIsAutoCenter((prev) => {
            if (!prev) map.setView(position);
            return !prev;
          });
        }}
        className="bg-white px-4 py-2.5 rounded-xl shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2 text-sm font-medium text-gray-700"
      >
        <Navigation className={`w-4 h-4 ${isAutoCenter ? 'text-blue-600' : 'text-gray-400'}`} />
        {isAutoCenter ? "Auto Center" : "Follow Me"}
      </button>
    </div>
  );
};

export default UserTrackDistance;