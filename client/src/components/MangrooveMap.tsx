import React, { useEffect, useState } from "react";
import Map, { Marker, Popup } from "react-map-gl/mapbox";
import { MapPin, UserCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

import "mapbox-gl/dist/mapbox-gl.css";

const TREE =
  "https://th.bing.com/th/id/R.3296d1e5beddbe7bb441ff416f5bbfe1?rik=AcTM3UbKAxP31w&riu=http%3a%2f%2fclipart-library.com%2fimage_gallery%2fn724865.png&ehk=fG4%2bk1tvUBSEie5Rrh5uIlCq%2bMCJrKcslbskWDfg2Sw%3d&risl=&pid=ImgRaw&r=0";

const plant_pic =
  "https://ilovepangasinan.com/wp-content/uploads/2019/06/Bangrin-Mangrove-Marine-Protected-Area-3.jpg";

type MangroveSite = {
  name: string;
  region: string;
  description: string;
  coords: [number, number]; // [lat, lng]
  imageUrl: string;
};

const mangroveSites: MangroveSite[] = [
  {
    name: "Banacon Island Mangrove Forest",
    region: "Bohol, Visayas",
    description:
      "Largest man-made mangrove forest in Asia; active community restoration.",
    coords: [10.15, 124.25],
    imageUrl: plant_pic,
  },
];

export default function MangroveMap() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null,
  );
  const [selectedSite, setSelectedSite] = useState<MangroveSite | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  }, []);

  const initialLng = userLocation ? userLocation[1] : 121.774;
  const initialLat = userLocation ? userLocation[0] : 12.8797;

  return (
    <div className="rounded-2xl bg-transparent overflow-hidden relative z-0">
      <Card className="rounded-3xl bg-transparent shadow-sm hover:shadow-md transition">
        <CardHeader>
          <CardTitle>Planting Locations Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            style={{
              height: 600,
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <Map
              initialViewState={{
                latitude: initialLat,
                longitude: initialLng,
                zoom: 8,
                pitch: 50,
                bearing: 0,
              }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              mapboxAccessToken={import.meta.env.VITE_MAPBOX_TOKEN}
              style={{ width: "100%", height: "100%" }}
              terrain={{ source: "mapbox-dem", exaggeration: 5 }}
              attributionControl={false}
            >
              {/* Mangrove site markers */}
              {mangroveSites.map((site) => (
                <Marker
                  key={site.name}
                  latitude={site.coords[0]}
                  longitude={site.coords[1]}
                  onClick={() => setSelectedSite(site)}
                >
                  <div className="cursor-pointer drop-shadow-2xl">
                    <img
                      src={TREE}
                      alt="Tree planting site"
                      style={{
                        width: "40px",
                        height: "40px",
                        objectFit: "contain",
                        transform: "translateY(-10px)",
                      }}
                    />
                  </div>
                </Marker>
              ))}

              {/* Selected site popup */}
              {selectedSite && (
                <Popup
                  latitude={selectedSite.coords[0]}
                  longitude={selectedSite.coords[1]}
                  onClose={() => setSelectedSite(null)}
                  closeButton={true}
                  closeOnClick={false}
                  anchor="top"
                  offset={50}
                >
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{selectedSite.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedSite.region}
                    </p>
                    <p className="text-xs mt-1">{selectedSite.description}</p>
                    <img
                      src={selectedSite.imageUrl}
                      alt={selectedSite.name}
                      className="h-32 w-full object-cover mt-3 rounded-lg"
                    />
                  </div>
                </Popup>
              )}

              {/* User location marker */}
              {userLocation && (
                <Marker latitude={userLocation[0]} longitude={userLocation[1]}>
                  <div className="relative">
                    {/* Green circle with user icon */}
                    <div
                      className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center shadow-lg"
                      style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                    >
                      <UserCircle size={24} color="#fff" />
                    </div>
                    {/* Pin point */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
                      style={{
                        borderLeft: "10px solid transparent",
                        borderRight: "10px solid transparent",
                        borderTop: "14px solid #10ab46",
                      }}
                    />
                  </div>
                </Marker>
              )}
            </Map>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
