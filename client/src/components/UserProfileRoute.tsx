import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import { userProfileDone } from "../lib/api";

const PrivateRoute3 = () => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkUserProfileStatus = async () => {
      try {
        const response = await userProfileDone();
        if (response?.userProfileDone) {
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("Error checking user profile status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserProfileStatus();
  }, []);

  if (loading) return <Spinner />;

  return isAllowed ? <Outlet /> : <Navigate to="/userprofile" replace />;
};

export default PrivateRoute3;
