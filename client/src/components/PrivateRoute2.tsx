import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import useAuth from "../hooks/useAuth";

const PrivateRoute = () => {
  const [loading, setLoading] = useState(true);
  const [isAssessmentComplete, setIsAssessmentComplete] = useState(false);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const checkUserStatus = async () => {
      // Only check user status if user is authenticated
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user has completed the assessment
        const assessmentResponse = await fetch("http://localhost:4004/api/preassessment/user/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const assessmentData = await assessmentResponse.json();
        if (assessmentResponse.ok && assessmentData?.assessmentDone) {
          setIsAssessmentComplete(true);
        } else {
          setIsAssessmentComplete(false);
        }

        // Check if user profile is complete
        const profileResponse = await fetch("http://localhost:4004/profile/user/status", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const profileData = await profileResponse.json();
        if (profileResponse.ok && profileData?.userProfileDone) {
          setIsProfileComplete(true);
        } else {
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error checking assessment or profile status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [user]);

  if (loading) return <Spinner />;

  // If assessment is complete and the user tries to access /pre-assessment, redirect them
  if (isAssessmentComplete) {
    return <Navigate to="/home" replace />;
  }

  // If assessment is done but profile is not done, redirect to /userprofile
  if (isAssessmentComplete && !isProfileComplete) {
    return <Navigate to="/userprofile" replace />;
  }

  // If the user hasn't completed the assessment, they can access the /pre-assessment route
  return <Outlet />;
};

export default PrivateRoute;
