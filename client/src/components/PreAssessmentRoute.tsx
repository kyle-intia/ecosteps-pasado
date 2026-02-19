import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import { assessmentDone } from "../lib/api";

const PreAssessmentRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      try {
        const response = await assessmentDone();
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
  }, []);

  if (loading) return <Spinner />;

  return isAllowed ? <Outlet /> : <Navigate to="/pre-assessment" replace />;
};

export default PreAssessmentRoute;
