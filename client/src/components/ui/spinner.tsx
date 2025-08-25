import * as React from "react";

interface SpinnerProps {
  size?: string; // optional size prop (default is 8)
  color?: string; // optional color prop (default is blue)
  loading?: boolean; // optional prop to control visibility of spinner
  className?: string; // optional custom className for additional styling
}

const Spinner: React.FC<SpinnerProps> = ({
  size = "8", // default size (Tailwind scale: 8 -> 2rem)
  color = "border-primary", // default color for spinner's border
  loading = true, // default state is loading (visible)
  className = "",
}) => {
  if (!loading) return null; // If not loading, do not render the spinner

  return (
    <div
      className={`relative flex justify-center items-center ${className}`}
      style={{
        width: `${parseInt(size) * 2}rem`, // Calculate size based on Tailwind scale
        height: `${parseInt(size) * 2}rem`, // Calculate size based on Tailwind scale
      }}
    >
      <div
        className={`border-4 ${color} border-t-4 border-gray-200 rounded-full animate-spin`}
        style={{
          width: "100%",
          height: "100%",
        }}
      ></div>
    </div>
  );
};

export { Spinner };
