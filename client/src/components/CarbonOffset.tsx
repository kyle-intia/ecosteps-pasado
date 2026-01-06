import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

// Constants for tree offsets
export const TREE_OFFSET = {
  terrestrial: 22,
  mangrove: 52,
};

// Function to calculate the number of trees needed to offset the carbon footprint
export function calculateTrees(dailyCarbon: number) {
  const terrestrialTrees = dailyCarbon / TREE_OFFSET.terrestrial;
  const mangroveTrees = dailyCarbon / TREE_OFFSET.mangrove;

  return {
    terrestrial: terrestrialTrees,
    mangrove: mangroveTrees,
  };
}

interface CarbonOffsetProps {
  dailyCarbon: number; // Carbon footprint in kg CO₂e
}

// URLs for tree images
const TERRESTRIAL_ICON =
  "https://th.bing.com/th/id/R.3296d1e5beddbe7bb441ff416f5bbfe1?rik=AcTM3UbKAxP31w&riu=http%3a%2f%2fclipart-library.com%2fimage_gallery%2fn724865.png&ehk=fG4%2bk1tvUBSEie5Rrh5uIlCq%2bMCJrKcslbskWDfg2Sw%3d&risl=&pid=ImgRaw&r=0";

const MANGROVE_ICON =
  "https://png.pngtree.com/png-clipart/20221223/original/pngtree-mangrove-tree-vector-illustrations-hand-drawn-art-isolated-on-white-png-image_8799817.png";

// Tree Icon component
function TreeIcon({ type, isPartial = false, fraction = 0 }: { type: "terrestrial" | "mangrove"; isPartial?: boolean; fraction?: number }) {
  const src = type === "terrestrial" ? TERRESTRIAL_ICON : MANGROVE_ICON;

  if (!isPartial) {
    return (
      <img
        src={src}
        alt={`${type} tree`}
        className="w-16 h-16 object-contain drop-shadow-sm"
      />
    );
  }

  // Rendering partial tree (with filled portion)
  return (
    <div className="relative w-16 h-16">
      <img
        src={src}
        alt="partial tree"
        className="absolute inset-0 w-full h-full object-contain opacity-30"
      />
      <div className="absolute inset-x-0 bottom-0 overflow-hidden" style={{ height: `${Math.min(fraction, 1) * 100}%` }}>
        <img
          src={src}
          alt="filled portion"
          className="w-full h-full object-contain object-bottom"
        />
      </div>
    </div>
  );
}

// Function to render tree icons based on the count (full and fractional trees)
function renderTrees(count: number, type: "terrestrial" | "mangrove") {
  const full = Math.floor(count);
  const fraction = count - full;
  const trees = [];

  // Render full trees
  for (let i = 0; i < full; i++) {
    trees.push(<TreeIcon key={`full-${i}`} type={type} />);
  }

  // Render fractional tree if necessary
  if (fraction > 0) {
    trees.push(
      <TreeIcon
        key="partial"
        type={type}
        isPartial
        fraction={fraction}
      />
    );
  }

  return trees;
}

// CarbonOffset component
const CarbonOffset: React.FC<CarbonOffsetProps> = ({ dailyCarbon }) => {
  const { terrestrial, mangrove } = calculateTrees(dailyCarbon);

  return (
    <Card className="rounded-3xl bg-transparent">
      <CardHeader>
        <CardTitle>Actions to Offset Your Footprint</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-lg">
          Your Weekly carbon footprint:{" "}
          <strong className="text-2xl">{dailyCarbon.toFixed(1)} kg CO₂e</strong>
        </p>

        <div className="flex flex-row gap-12">
          {/* Terrestrial Tree Section */}
          <div>
            <div className="mb-4">
              <p className="text-xl font-semibold">Terrestrial Tree</p>
              {/* <p className="text-sm text-gray-600 mt-1">
                1 tree offsets ~{TREE_OFFSET.terrestrial} kg CO₂ over its lifetime
              </p> */}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              {renderTrees(terrestrial, "terrestrial")}
            </div>
            <div>
              <span className="text-sm text-gray-600 self-end">
                ≈ {terrestrial.toFixed(2)} trees needed
              </span>
            </div>
          </div>

          {/* Mangrove Tree Section */}
          <div>
            <div className="mb-4">
              <p className="text-xl font-semibold">Mangrove Tree</p>
              {/* <p className="text-sm text-gray-600 mt-1">
                1 tree offsets ~{TREE_OFFSET.mangrove} kg CO₂ over its lifetime
              </p> */}
            </div>

            <div className="flex flex-wrap items-end gap-4">
              {renderTrees(mangrove, "mangrove")}
            </div>
            <div>
              <span className="text-sm text-gray-600 self-end">
                ≈ {mangrove.toFixed(2)} trees needed
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonOffset;
