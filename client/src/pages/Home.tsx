import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import heroImage from "@/assets/hero-eco.jpg";
import { 
  ChevronRight,
  Sparkles,
  Clock,
  Users,
  Award,
  Plus,
  Lightbulb,
  Leaf,
  Activity,
  Coffee,
  MapPin,
  ArrowRight,
  Target
} from "lucide-react";

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    const user = localStorage.getItem("userName") || "EcoWarrior";
    
    if (!loggedIn) {
      navigate("/");
      return;
    }
    
    setIsLoggedIn(loggedIn);
    setUserName(user);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      {/* Hero Section */}
      <div className="relative h-80 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Nature landscape" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white max-w-2xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome, {userName}! 🌱
              </h1>
              <p className="text-lg text-white/90 mb-6">
                Here's what's new today
              </p>
              <Button 
                onClick={() => navigate("/track")} 
                className="bg-white text-black hover:bg-white/90"
              >
                Track Today's Impact
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Highlight */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-card">
          <CardContent className="p-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary rounded-full">
                <Target className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-foreground mb-2">Eco-Challenge Of The Day</h2>
                <p className="text-muted-foreground text-lg">
                  Take the stairs instead of the elevator – small steps reduce big CO₂! 
                  <span className="font-medium text-primary"> Each flight saves ~0.3kg CO₂.</span>
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 hover:bg-primary/5 hover:border-primary/50"
            onClick={() => navigate("/track")}
          >
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Track Footprint</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 hover:bg-warning/5 hover:border-warning/50"
            onClick={() => navigate("/community")}
          >
            <Lightbulb className="h-6 w-6 text-warning" />
            <span className="text-sm font-medium">Smart Tips</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 hover:bg-accent/5 hover:border-accent/50"
            onClick={() => navigate("/community")}
          >
            <Users className="h-6 w-6 text-accent" />
            <span className="text-sm font-medium">Community</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-24 flex flex-col space-y-2 hover:bg-success/5 hover:border-success/50"
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
                  <Button variant="ghost" size="sm" onClick={() => navigate("/track")}>
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
                    <p className="text-sm font-medium text-foreground">Logged 2km walk</p>
                    <p className="text-xs text-muted-foreground">0.5kg CO₂ saved • 2 hours ago</p>
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
                      <strong>@sarah_green</strong> planted 5 trees and earned the Forest Guardian badge! 🌳
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
                      <strong>@mike_eco</strong> completed a 30-day zero-waste challenge! ♻️
                    </p>
                    <p className="text-xs text-muted-foreground">5 hours ago</p>
                  </div>
                </div>
                
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
                  <div className="text-3xl font-bold text-success">2.1kg</div>
                  <div className="text-sm text-muted-foreground">CO₂ saved</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-xl font-semibold text-primary">847</div>
                    <div className="text-xs text-muted-foreground">Eco Score</div>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-warning">#42</div>
                    <div className="text-xs text-muted-foreground">Global Rank</div>
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
                  className="w-full justify-start"
                  onClick={() => navigate("/dashboard")}
                >
                  <Activity className="h-4 w-4 mr-3" />
                  Full Dashboard
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => navigate("/leaderboards")}
                >
                  <Award className="h-4 w-4 mr-3" />
                  Leaderboards
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
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