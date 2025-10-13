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

type Category = "private" | "public" | "basic";

const transportTypes = {
  private: ["diesel", "electric", "gasoline", "hybrid", "motorcycle"],
  public: ["tricycle", "jeep", "e-jeep", "train"],
  basic: ["walk", "bicycle"],
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
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/activities`, {
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          category,
          subtype,
          points: positions,
          totalDistance,
          duration: elapsedTime,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Activity Saved",
          description: "Your tracking data has been saved!",
          variant: "success"
        });
      } else {
        toast({
          title: "Save Failed",
          description: data.message || "Something went wrong saving your activity.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "Network Error",
        description: "Unable to connect to server. Please try again later.",
        variant: "destructive",
      });
    }
  }, [positions, totalDistance, elapsedTime, category, subtype, toast]);

  const handleToggleTracking = () => {
    tracking ? stopTracking() : startTracking();
  };

  const handleSignOut = () => signOut();

  if (isPending) return <Spinner />;

  return (
    <div className="min-h-screen bg-muted">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">🌍 Track Your Activity</h1>

        <div className="flex gap-4">
          <select
            value={category}
            onChange={(e) => {
              const newCat = e.target.value as Category;
              setCategory(newCat);
              setSubtype(transportTypes[newCat][0]);
            }}
            disabled={tracking}
            className="border p-2 rounded"
          >
            {Object.keys(transportTypes).map((cat) => (
              <option key={cat} value={cat}>
                {cat.toUpperCase()}
              </option>
            ))}
          </select>

          <select
            value={subtype}
            onChange={(e) => setSubtype(e.target.value)}
            disabled={tracking}
            className="border p-2 rounded"
          >
            {transportTypes[category].map((sub) => (
              <option key={sub} value={sub}>
                {sub.toUpperCase()}
              </option>
            ))}
          </select>

          <Button onClick={handleToggleTracking} variant={tracking ? "destructive" : "success"}>
            {tracking ? "Stop and Save" : "Start"}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Stat label="Distance" value={`${totalDistance.toFixed(2)} km`} />
          <Stat label="Time" value={formatTime(elapsedTime)} />
        </div>

        {positions.length > 0 && (
          <MapContainer
            center={[positions[0].latitude, positions[0].longitude]}
            zoom={16}
            style={{ height: "70vh", borderRadius: "10px" }}
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
              pathOptions={{ color: "blue" }}
            />
            <Marker
              position={[
                positions[positions.length - 1].latitude,
                positions[positions.length - 1].longitude,
              ]}
            />
          </MapContainer>
        )}
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="p-4 bg-white rounded-lg shadow text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const RecenterMap = ({ position }: { position: [number, number] }) => {
  const map = useMap();
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  useEffect(() => {
    if (isAutoCenter) {
      map.setView(position);
    }
  }, [position, isAutoCenter, map]);

  return (
    <div className="absolute top-2 right-2 z-[1000] bg-white p-2 rounded shadow">
      <button
        onClick={() => {
          setIsAutoCenter((prev) => {
            if (!prev) map.setView(position);
            return !prev;
          });
        }}
        className="text-sm"
      >
        {isAutoCenter ? "🔓 Free Move" : "🎯 Center Map"}
      </button>
    </div>
  );
};

export default UserTrackDistance;
