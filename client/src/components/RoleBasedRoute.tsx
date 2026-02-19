import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Spinner } from "./ui/spinner";
import { getUserRole } from "../lib/api";

interface RoleBasedRouteProps {
  allowedRoles: string[];
  redirectTo?: string;
}

const RoleBasedRoute = ({
  allowedRoles,
  redirectTo = "/notfound",
}: RoleBasedRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const data = await getUserRole();
        if (allowedRoles.includes(data?.role)) {
          setIsAllowed(true);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [allowedRoles]);

  if (loading) return <Spinner />;

  return isAllowed ? <Outlet /> : <Navigate to={redirectTo} replace />;
};

export default RoleBasedRoute;
