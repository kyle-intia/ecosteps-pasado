// client/src/pages/Home.tsx
// Updated Home page with integrated Eco-Challenge section

import { useEffect, useState } from "react";
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
  Target
} from "lucide-react";

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
  const { user, isLoading, isError, error } = useProfile();

  const profile = user as UserProfile | undefined;

  if (isLoading) 
    return <Spinner />;
  if (isError) 
    return <p>Error: {String(error)}</p>;

  const handleSignOut = () => {
    signOut();
  };

  if (isPending) {
    return <Spinner />;
  }

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
                Welcome, {profile?.username || "Eco Warrior"}! 🌱
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
            onClick={() => navigate("/community")}
          >
            <Lightbulb className="h-6 w-6 text-warning" />
            <span className="text-sm font-medium">Smart Tips</span>
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
                  <Button variant="ghost" size="sm" className="transition-all duration-300 ease-out" onClick={() => navigate("/track")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-success rounded-full">
                    <Activity className="h-4 w-4 text-success-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Completed eco-challenge</p>
                    <p className="text-xs text-muted-foreground">Walking Warrior challenge • 1 hour ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-primary rounded-full">
                    <MapPin className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Used public transport</p>
                    <p className="text-xs text-muted-foreground">Morning commute • 6 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
                  <div className="p-2 bg-accent rounded-full">
                    <Coffee className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Chose eco bag at store</p>
                    <p className="text-xs text-muted-foreground">Grocery shopping • Yesterday</p>
                  </div>
                </div>
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
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
                    S
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <strong>@sarah_green</strong> completed all 3 eco-challenges and earned the Daily Champion badge! 🌟
                    </p>
                    <p className="text-xs text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center text-white font-bold">
                    M
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-foreground">
                      <strong>@mike_eco</strong> completed the Car-Free Commuter challenge for 30 days straight! 🚴‍♂️
                    </p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-4 transition-all duration-300 ease-out"
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
                  <div className="text-3xl font-bold text-success">3.8kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ saved</div>
                  <div className="text-xs text-green-600 mt-1">+1.7kg from challenges!</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-primary">1,047</div>
                    <div className="text-xs text-muted-foreground">Eco Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-warning">#28</div>
                    <div className="text-xs text-muted-foreground">Global Rank</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-accent">2/3</div>
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
                    <span className="font-medium">15/21</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '71%' }}></div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Perfect Days</span>
                    <span className="font-medium">3</span>
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