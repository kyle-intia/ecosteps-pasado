import React, { Suspense, lazy } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import useAuth from "@/hooks/useAuth";

const AppContainer = () => {
  const { user, isLoading, error } = useAuth();


  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    );
  }

  // Error handling state
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-lg text-red-500">
          There was an error loading authentication. Please try again later.
        </p>
      </div>
    );
  }

  // Authenticated user state
  if (user) {
    return (
      <div className="p-4 min-h-screen bg-gray-100">
        <Suspense
          fallback={<div className="text-gray-500">Loading User Menu...</div>}
        >
        </Suspense>
        <Outlet />
      </div>
    );
  }

  // Redirect to login if no user is authenticated
  return (
    <Navigate
      to="/login"
      replace
      state={{ redirectUrl: window.location.pathname }}
    />
  );
};

export default AppContainer;
