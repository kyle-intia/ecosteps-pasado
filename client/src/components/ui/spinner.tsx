<<<<<<< HEAD
function Spinner() {
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-white">
      <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-green-500" />
    </div>
  );
}

=======
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

>>>>>>> c6059f8e8fe8634fc8af4f54f89449f8e645847e
export { Spinner };
