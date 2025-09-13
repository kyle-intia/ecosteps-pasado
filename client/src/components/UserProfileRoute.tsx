// PrivateRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";

const PrivateRoute3 = () => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      try {
        const response = await fetch("http://localhost:4004/profile/user/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data?.userProfileDone) {
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("Error checking assessment status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAssessmentStatus();
  }, []);

  if (loading) 
    return <Spinner />; 

  return isAllowed ? <Outlet /> : <Navigate to="/userprofile" replace />;
};

export default PrivateRoute3;
