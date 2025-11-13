// client/src/pages/Home.tsx
// Updated Home page with integrated Eco-Challenge section

import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import EcoChallengeSection from "@/components/EcoChallengeSection";
import homeImage from "@/assets/register.png";
import { 
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  Award,
  Plus,
  Lightbulb,
  Activity,
  Coffee,
  MapPin,
  ArrowRight,
  Target,
  RefreshCw,
  MessageSquare
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLeaderboard } from "../hooks/useLeaderboard";
import useRecentActivities from "../hooks/useRecentActivities";
import useCommunityHighlights from "../hooks/useCommunityHighlights";
import useChallengeProgress from "../hooks/useChallengeProgress";
import useCO2Savings from "../hooks/useCO2Savings";
import { useDashboardData } from "../hooks/useDashboard";

type UserProfile = {
  username?: string;
};

import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus"
import useSignOut from "../hooks/useLogout"
import useProfile from "@/hooks/useAuthProfile";

const Home = () => {
  const navigate = useNavigate();
  const { isPending, isLoggedIn} = useSessionStatus();
  const { signOut } = useSignOut()
  const { user, isLoading, isError, error: profileError } = useProfile();
  const { userLeaderboard, pending, error: leaderboardError } = useLeaderboard();

  // New hooks for dynamic data
  const { activities, isLoading: activitiesLoading, isError: activitiesError, refetch: refetchActivities } = useRecentActivities();
  const { highlights, isLoading: highlightsLoading, isError: highlightsError } = useCommunityHighlights();
  const { weeklyProgress, todaysProgress, isLoading: progressLoading, isError: progressError, refetch: refetchProgress } = useChallengeProgress();
  const { todaysSavings, weeklySavings, isLoading: savingsLoading, isError: savingsError, refetch: refetchSavings } = useCO2Savings();
  const { 
    data: dashboardData, } = useDashboardData();

  const { metrics } = dashboardData?.data || {};

  // Check if data is loaded and accessible
  const C02Saved = metrics?.c02Saved || 0;

  const profile = user as UserProfile | undefined;

  if (isLoading)
    return <Spinner />;
  if (isError)
    return <p>Error: {String(profileError)}</p>;

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Spinner />;
  }

  if (pending)
    return <Spinner></Spinner>

  const ecoScore = leaderboardError ? 'N/A' : userLeaderboard?.totalScore ?? 'N/A';
  const currentRank = leaderboardError ? 'N/A' : userLeaderboard?.currentRank ?? 'N/A';

  // Time-based greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Refresh all data
  const handleRefresh = () => {
    refetchActivities();
    refetchProgress();
    refetchSavings();
  };




  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
      {/* Home Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={homeImage} 
          alt="Nature landscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {getTimeBasedGreeting()}, {profile?.username || "Eco Warrior"}!🌱 
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Here's what's new today
              </p>
              <Button 
                onClick={() => navigate("/track")} 
                className="bg-white text-black transition-all duration-300 ease-out hover:bg-white/90 "
              >
                Track Today's Impact
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Eco-Challenge Section - Primary above the fold placement */}
        <EcoChallengeSection />

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 transition-all duration-300 ease-out hover:bg-primary/5 hover:border-primary/50"
            onClick={() => navigate("/track")}
          >
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Track Footprint</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 transition-all duration-300 ease-out hover:bg-warning/5 hover:border-warning/50"
            onClick={() => navigate("/dasboard")}
          >
            <Lightbulb className="h-6 w-6 text-warning" />
            <span className="text-sm font-medium">Dashboard</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 transition-all duration-300 ease-out hover:bg-accent/5 hover:border-accent/50"
            onClick={() => navigate("/community")}
          >
            <Users className="h-6 w-6 text-accent" />
            <span className="text-sm font-medium">Community</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 transition-all duration-300 ease-out hover:bg-success/5 hover:border-success/50"
            onClick={() => navigate("/achievements")}
          >
            <Award className="h-6 w-6 text-success" />
            <span className="text-sm font-medium">Achievements</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Activity */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Recent Activity</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={activitiesLoading}>
                      <RefreshCw className={`h-4 w-4 ${activitiesLoading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button variant="ghost" size="sm" className="transition-all duration-300 ease-out" onClick={() => navigate("/track")}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activitiesLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : activitiesError ? (
                  <p className="text-sm text-destructive">Failed to load activities</p>
                ) : activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                      <div className="p-2 bg-primary rounded-full">
                        <Activity className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.description} • {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No recent activities</p>
                )}
              </CardContent>
            </Card>

            {/* Community Highlights */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-warning" />
                  <span>Community Highlights</span>
                </CardTitle>
                <CardDescription>See what others are achieving</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {highlightsLoading ? (
                  <div className="flex justify-center py-4">
                    <Spinner />
                  </div>
                ) : highlightsError ? (
                  <p className="text-sm text-destructive">Failed to load highlights</p>
                ) : highlights.length > 0 ? (
                  highlights.map((highlight, index) => (
                    <div key={highlight.id} className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                        {highlight.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <strong>@{highlight.username}</strong> {highlight.content}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(highlight.timestamp, { addSuffix: true })}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No highlights available</p>
                )}
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => navigate("/community")}
                >
                  Join the Conversation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Your Impact Today</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-success">
                    {savingsLoading ? <Spinner /> : `${C02Saved}kg`|| 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground">CO₂ saved</div>
                  <div className="text-xs text-green-600 mt-1">
                    {savingsLoading ? '' : savingsError ? '' : `+${weeklySavings}kg from challenges!`}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-primary">{ecoScore}</div>
                    <div className="text-xs text-muted-foreground">Eco Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-warning">{currentRank}</div>
                    <div className="text-xs text-muted-foreground">Global Rank</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-accent">
                      {progressLoading ? <Spinner /> : progressError ? 'N/A' : `${todaysProgress.completed}/${todaysProgress.total}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Challenges Today</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Progress Card */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-primary" />
                  <span>Challenge Progress</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>This Week</span>
                    <span className="font-medium">
                      {progressLoading ? <Spinner /> : progressError ? 'N/A' : `${weeklyProgress.completed}/${weeklyProgress.total}`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: progressLoading || progressError ? '0%' : `${weeklyProgress.percentage}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Perfect Days</span>
                    <span className="font-medium">
                      {progressLoading ? <Spinner /> : progressError ? 'N/A' : weeklyProgress.perfectDays}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Days with all 3 challenges completed
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Navigation */}
            <Card className="shadow-card border-border">
              <CardHeader>
                <CardTitle>Explore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start transition-all duration-300 ease-out"
                  onClick={() => navigate("/dashboard")}
                >
                  <Activity className="h-4 w-4 mr-3" />
                  Full Dashboard
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start transition-all duration-300 ease-out"
                  onClick={() => navigate("/leaderboards")}
                >
                  <Award className="h-4 w-4 mr-3" />
                  Leaderboards
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start transition-all duration-300 ease-out"
                  onClick={() => navigate("/profile")}
                >
                  <Users className="h-4 w-4 mr-3" />
                  My Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;