// PrivateRoute.tsx
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import useAuth from "../hooks/useAuth";

const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      // Only check assessment status if user is authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("http://localhost:4004/api/preassessment/user/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data?.assessmentDone) {
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("Error checking assessment status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAssessmentStatus();
  }, [user]);

  if (loading)
    return <Spinner />;

  return isAllowed ? <Outlet /> : <Navigate to="/pre-assessment" replace />;
};

export default PrivateRoute;
