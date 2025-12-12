import React from "react";

export const TREE_OFFSET = {
  terrestrial: 10,
  mangrove: 12.3,  
};

export function calculateTrees(dailyCarbon: number) {
  const terrestrialTrees = dailyCarbon / TREE_OFFSET.terrestrial;
  const mangroveTrees = dailyCarbon / TREE_OFFSET.mangrove;

  return {
    terrestrial: terrestrialTrees,
    mangrove: mangroveTrees,
  };
}

interface CarbonOffsetProps {
  dailyCarbon: number; // in kg CO2e
}

const CarbonOffset: React.FC<CarbonOffsetProps> = ({ dailyCarbon }) => {
  const { terrestrial, mangrove } = calculateTrees(dailyCarbon);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Action to Make</h2>
      <p className="mb-6">
        Your daily carbon footprint: <strong>{dailyCarbon.toFixed(1)} kg CO₂e</strong>
      </p>

      <div className="space-y-4">
        <div className="p-4 border rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold">Terrestrial Tree</p>
            <p className="text-sm text-gray-500">
              1 tree offsets ~{TREE_OFFSET.terrestrial} kg CO₂ over its lifetime
            </p>
          </div>
          <span className="text-lg font-bold">
            {terrestrial.toFixed(2)}
          </span>
        </div>

        <div className="p-4 border rounded-lg flex justify-between items-center">
          <div>
            <p className="font-semibold">Mangrove Tree</p>
            <p className="text-sm text-gray-500">
              1 tree offsets ~{TREE_OFFSET.mangrove} kg CO₂ over its lifetime
            </p>
          </div>
          <span className="text-lg font-bold">
            {mangrove.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CarbonOffset;