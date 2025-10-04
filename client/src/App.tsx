// App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TrackCarbon from "./pages/TrackCarbon";
import Community from "./pages/Community";
import Leaderboards from "./pages/Leaderboards";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import PreAssessment from "./pages/PreAssessment";
import Achievements from "./pages/Achievements";
import NotFound from "./pages/NotFound";
import queryClient from "./config/queryClient";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailPrompt from "./pages/VerifyEmailPrompt";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import UserSession from "./pages/UserSession";
import Settings from "./pages/Settings";
import ProfilePage from "./pages/userprofile";
import { useEffect } from "react";
import { setNavigate } from "./lib/navigate";
import PreAssessmentRoute from "./components/PreAssessmentRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import UserProfileRoute from "./components/UserProfileRoute";
import ActivityLogs from "./ecosteps-admin/ActivityLogs";
import Users from "./ecosteps-admin/Users";
import AdminDashboard from "./ecosteps-admin/AdminDashboard";
import FootprintSummary from "./ecosteps-admin/FootprintSummary";
import AdminSettings from "./ecosteps-admin/AdminSettings";
import { AdminLayout } from "./components/AdminLayout";
import BadgeAchievements from "./ecosteps-admin/BadgeAchievement";
import EcoChallenges from "./ecosteps-admin/EcoChallenge";

const App: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>

          
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email-prompt" element={<VerifyEmailPrompt />} />
            <Route path="/email/verify/:code" element={<VerifyEmail />} />
            <Route path="/password/forgot" element={<ForgotPassword />} />
            <Route path="/password/reset" element={<ResetPassword />} />
            

            <Route element={<RoleBasedRoute allowedRoles={['user']} />}>
              <Route path="/pre-assessment" element={<PreAssessment />} />
              <Route path="/userprofile" element={<ProfilePage />}/>

              <Route element={<PreAssessmentRoute />}>
                <Route element={<UserProfileRoute/>}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/track" element={<TrackCarbon />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/leaderboards" element={<Leaderboards />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/sessions" element={<UserSession />} />
                  <Route path="/achievements" element={<Achievements />} />
                </Route>
              </Route>
          </Route>

          
          <Route element={<RoleBasedRoute allowedRoles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/logs" element={<ActivityLogs />} />
            <Route path="/admin/badges" element={<BadgeAchievements />} />
            <Route path="/admin/eco-challenges" element={<EcoChallenges />} />
            <Route path="/admin/footprint" element={<FootprintSummary />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          </Route>

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
