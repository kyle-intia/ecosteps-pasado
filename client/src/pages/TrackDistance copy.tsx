import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap } from "react-leaflet";
import { point, distance } from '@turf/turf';

const Tracker = () => {
  const [tracking, setTracking] = useState(false);
  const [positions, setPositions] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("basic");
  const [subType, setSubType] = useState("Walk");

  const timerRef = useRef(null);
  const watchIdRef = useRef(null);

  const categories = {
    private: ["Diesel", "Gasoline", "Electric", "Hybrid", "Motorcycle"],
    public: ["Jeep", "Tricycle", "Bus", "Train"],
    basic: ["Run", "Walk", "Bike"],
  };


  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // ✅ Distance calculation (Haversine)
const calcDistance = useCallback((p1, p2) => {
  const point1 = point([p1.longitude, p1.latitude]);
  const point2 = point([p2.longitude, p2.latitude]);
  
  return distance(point1, point2, { units: 'kilometers' });
}, []);

  // 🕒 Format time as mm:ss
  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  // ▶️ Start Tracking
  let lastPositionTime = 0;

  const startTracking = useCallback(() => {
    setPositions([]);
    setTotalDistance(0);
    setElapsedTime(0);
    setStatus("");

    timerRef.current = setInterval(() => {
      setElapsedTime((t) => t + 1);
    }, 1000);

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const currentTime = new Date().getTime();

          // Throttle: update only if at least 1000 ms have passed
          if (currentTime - lastPositionTime > 1000) {
            lastPositionTime = currentTime; // Update last position time

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

          let errorMessage = "";
          
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = "⛔ Location permission denied. Please enable location services.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "⚠️ Position unavailable. Please try again.";
              break;
            case err.TIMEOUT:
              errorMessage = "⏱️ Location request timed out. Move to an open area.";
              break;
            default:
              errorMessage = "⚠️ GPS Error: " + err.message;
          }

        setStatus(errorMessage);
      },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    } else {
      setStatus("⚠️ Geolocation not supported.");
    }
  }, [calcDistance]);

  // ⏹️ Stop Tracking
  const stopTracking = useCallback(async () => {
    clearInterval(timerRef.current);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    if (positions.length < 2) {
      setStatus("Not enough data to save activity.");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/activity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          category,
          subType,
          points: positions,
          totalDistance,
          duration: elapsedTime,
        }),
      });

      const data = await res.json();
      setStatus(res.ok ? "✅ Activity saved!" : `⚠️ ${data.message || JSON.stringify(data)}`);
    } catch (err) {
      console.error(err);
      setStatus("⚠️ Network error.");
    }
  }, [positions, totalDistance, elapsedTime, category, subType]);

  // 🔁 Toggle Tracking
  const toggleTracking = useCallback(() => {
    if (!tracking) startTracking();
    else stopTracking();
    setTracking((t) => !t);
  }, [tracking, startTracking, stopTracking]);

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <h2>🌿 ECOmmunity Tracker</h2>

      {/* 🧩 Category & Subtype Selection */}
      <div style={{ marginBottom: "1rem" }}>
        <select
          value={category}
          onChange={(e) => {
            const newCat = e.target.value;
            setCategory(newCat);
            setSubType(categories[newCat][0]);
          }}
        >
          {Object.keys(categories).map((cat) => (
            <option key={cat} value={cat}>
              {cat.toUpperCase()}
            </option>
          ))}
        </select>

        <select
          value={subType}
          onChange={(e) => setSubType(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          {categories[category].map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* ▶️ / ⏹️ Button */}
      <button
        onClick={toggleTracking}
        style={{
          padding: "10px 20px",
          borderRadius: "8px",
          backgroundColor: tracking ? "#d9534f" : "#5cb85c",
          color: "white",
          border: "none",
          fontSize: "1rem",
          marginBottom: "1rem",
        }}
      >
        {tracking ? "Stop Tracking" : "Start Tracking"}
      </button>

      {status && <p>{status}</p>}

      {/* 📊 Stats Display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          background: "#f0f0f0",
          padding: "10px",
          borderRadius: "10px",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <Stat label="Distance" value={`${totalDistance.toFixed(2)} km`} />
        <Stat label="Time" value={formatTime(elapsedTime)} />
      </div>

      {/* 🗺️ Map */}
      {positions.length > 0 && (
        <MapContainer
          center={[positions[0].latitude, positions[0].longitude]}
          zoom={16}
          style={{ height: "70vh", width: "100%", borderRadius: "10px" }}
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
          <Polyline positions={positions.map((p) => [p.latitude, p.longitude])} />
          <Marker
            position={[
              positions[positions.length - 1].latitude,
              positions[positions.length - 1].longitude,
            ]}
          />
        </MapContainer>
      )}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ margin: "5px", minWidth: "100px" }}>
    <h4 style={{ margin: "0", color: "#333" }}>{label}</h4>
    <p style={{ margin: "0", fontWeight: "bold" }}>{value}</p>
  </div>
);

// Replace the existing RecenterMap component at the bottom of the file with this:
const RecenterMap = ({ position }) => {
  const map = useMap();
  const [isAutoCenter, setIsAutoCenter] = useState(true);

  useEffect(() => {
    if (position && isAutoCenter) {
      map.setView(position);
    }
  }, [position, map, isAutoCenter]);

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      zIndex: 999,
      backgroundColor: 'white',
      padding: '5px',
      borderRadius: '4px',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      <button 
        onClick={() => {
          setIsAutoCenter(!isAutoCenter);
          if (!isAutoCenter) {
            map.setView(position);
          }
        }}
        style={{
          padding: '8px',
          cursor: 'pointer',
          border: '1px solid #ccc',
          borderRadius: '4px',
          backgroundColor: isAutoCenter ? '#e0e0e0' : 'white'
        }}
      >
        {isAutoCenter ? '🔓 Free Move' : '🎯 Center Map'}
      </button>
    </div>
  );
};

export default Tracker;
