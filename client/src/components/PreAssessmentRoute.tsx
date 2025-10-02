import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import { assessmentDone } from "../lib/api";  // Import the API function
import useAuth from "../hooks/useAuth";

const PreAssessmentRoute = () => {
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
        const response = await assessmentDone(); // Use the API function here
        if (response?.assessmentDone) {
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

export default PreAssessmentRoute;
