import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import TrackCarbon from "./pages/TrackCarbon";
import Community from "./pages/Community";
import Leaderboards from "./pages/Leaderboards";
import Profile from "./pages/Profile";
import PreAssessment from "./pages/PreAssessment";
import NotFound from "./pages/NotFound";
import queryClient from "./config/queryClient";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/track" element={<TrackCarbon />} />
          <Route path="/community" element={<Community />} />
          <Route path="/leaderboards" element={<Leaderboards />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/pre-assessment" element={<PreAssessment />} />
          <Route path="/email/verify/:code" element={<VerifyEmail />} />
          <Route path="/password/forgot" element={<ForgotPassword />} />
          <Route path="/password/reset" element={<ResetPassword/>} />
          

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
