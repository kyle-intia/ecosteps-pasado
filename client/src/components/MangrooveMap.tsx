"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { MapPin, Navigation, User2, UserCircle, UserRound } from "lucide-react"; // Navigation icon for user
import { useEffect, useState } from "react";

const lucideMarker = divIcon({
  html: renderToString(<MapPin size={24} color="#d71919ff" />),
  className: "",
  iconSize: [32, 32],
});

const userMarker = divIcon({
  html: renderToString(
    <div
      style={{
        position: "relative",
        width: "40px",
        height: "50px",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      {/* Pin body */}
      <div
        style={{
          width: "36px",
          height: "36px",
          backgroundColor: "#10ab46ff",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          zIndex: 1,
        }}
      >
        <UserCircle size={20} color="#fff" />
      </div>

      {/* Pin point */}
      <div
        style={{
          position: "absolute",
          bottom: "0",
          width: "0",
          height: "0",
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "14px solid #10ab46ff",
          zIndex: 0,
        }}
      />
    </div>
  ),
  className: "",
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

type MangroveSite = {
  name: string;
  region: string;
  description: string;
  coords: [number, number];
  imageUrl: string;
};

const mangroveSites: MangroveSite[] = [
  {
    name: "Banacon Island Mangrove Forest",
    region: "Bohol, Visayas",
    description: "Largest man-made mangrove forest in Asia; active community restoration.",
    coords: [10.15, 124.25],
    imageUrl: "https://lh3.googleusercontent.com/blogger_img_proxy/AEn0k_uF8eafIo-5TlCXrEPIKN5AqrQ0NiBkUp-3IrudjwrK-EBK3i2QvT4zO_Ab5XQGBh_T3gELtKP2-85TCmeab_ZLXPgFtjkM8XodscK0Oi42gpIeDz_p4vwpgvR7_8csmOY5lps7nMVN67JFeuTdl_9fjQ8WXH4lBT4QoLwzQw=s0-d",
  },
  {
    name: "Cordova Mangrove Eco-Park",
    region: "Cebu, Visayas",
    description: "Accessible eco-park with ongoing mangrove rehabilitation.",
    coords: [10.25, 123.96],
    imageUrl: "/images/cordova.jpg",
  },
  {
    name: "Bani Mangrove Project",
    region: "Pangasinan, Luzon",
    description: "Community-driven mangrove planting along coastal zones.",
    coords: [16.16, 119.94],
    imageUrl: "/images/bani.jpg",
  },
  {
    name: "Mati Mangrove Coastline",
    region: "Davao Oriental, Mindanao",
    description: "Government-backed mangrove reforestation sites.",
    coords: [6.96, 126.23],
    imageUrl: "/images/mati.jpg",
  },
];

export default function MangroveMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={userLocation || [12.8797, 121.7740]}
        zoom={6}
        scrollWheelZoom={true}
        style={{ height: 600, width: "100%" }}
      >
      <TileLayer
        attribution='Tiles © Esri — Earthstar Geographics'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <TileLayer
        attribution='Tiles © Esri'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
      />

        {mangroveSites.map((site, idx) => (
          <Marker key={idx} position={site.coords}>
            <Popup>
              <h3 className="font-bold">{site.name}</h3>
              <p className="text-sm">{site.region}</p>
              <p className="text-xs mt-1">{site.description}</p>
              <img
                src={site.imageUrl}
                alt={site.name}
                className="h-32 w-full object-cover mt-2 rounded"
              />
            </Popup>
          </Marker>
        ))}

        {userLocation && (
          <Marker position={userLocation} icon={userMarker}>
            <Popup>Your current location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
