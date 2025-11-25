import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { TrendingDown, TrendingUp, Target, Award, Leaf, Zap, Car, Utensils, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useSignOut from "../hooks/useLogout";
import useProfile from "@/hooks/useAuthProfile";
import { Progress } from "@/components/ui/progress";
import { useDashboardData } from "../hooks/useDashboard";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import RecommendationView from "@/components/RecommendationView";
import { useLeaderboard } from "../hooks/useLeaderboard";

type UserProfile = {
  username?: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isPending, isLoggedIn } = useSessionStatus();
  
  const { signOut } = useSignOut();
  const { user, isLoading: profileLoading, isError: profileError } = useProfile();
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    isError: dashboardError,
    error: dashboardErrorDetails,
    refetch: refetchDashboard
  } = useDashboardData();
  const { userLeaderboard, pending, error } = useLeaderboard();

  const profile = user as UserProfile | undefined;


  const handleSignOut = () => {
    signOut();
  };

  const handleRefresh = async () => {
    try {
      await refetchDashboard();
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({
        title: "Dashboard updated",
        description: "Your data has been refreshed successfully.",
      });
    } catch (error) {
      toast({
        title: "Refresh failed", 
        description: "Unable to update dashboard data. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isPending || profileLoading) {
    return <Spinner />;
  }

  if (profileError) {
    return <p>Error loading profile: {String(profileError)}</p>;
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Unable to Load Dashboard</CardTitle>
            <CardDescription>
              {dashboardErrorDetails?.message || "Failed to fetch dashboard data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dashboardLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Spinner />
          </div>
        </main>
      </div>
    );
  }

  if (pending) 
    return <Spinner></Spinner>

  const { metrics, charts, recommendations, challengeStats, summary } = dashboardData?.data || {};
 
  // Use real data or fallbacks
  const currentEmissions = metrics?.currentEmissions || 0;
  const targetEmissions = metrics?.targetEmissions || 1.0;
  const reductionPercentage = metrics?.reductionPercentage || 0;
  const ecoScore = error ? 'N/A' : userLeaderboard?.totalScore ?? 'N/A';
  const treesSaved = metrics?.treesSaved || 0;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {profile?.username || 'User'}! 🌱
            </h1>
            <p className="text-muted-foreground">
              Here's your environmental impact dashboard for this month.
            </p>
          </div>
          <Button variant="outline" onClick={handleRefresh} className="flex items-center gap-2 transition-all duration-300 ease-out">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Emissions</CardTitle>
              {reductionPercentage > 0 ? (
                <TrendingDown className="h-4 w-4 text-success" />
              ) : (
                <TrendingUp className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{currentEmissions} tons</div>
              <p className={`text-xs ${reductionPercentage > 0 ? 'text-success' : 'text-destructive'}`}>
                {reductionPercentage > 0 ? '-' : '+'}{Math.abs(reductionPercentage)}% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Target</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{targetEmissions} tons</div>
              <p className="text-xs text-muted-foreground">
                {currentEmissions > targetEmissions 
                  ? `${Math.round((currentEmissions - targetEmissions) / targetEmissions * 100)}% above target`
                  : "Target achieved!"
                }
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eco Score</CardTitle>
              <Award className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{ecoScore}</div>
              <p className="text-xs text-muted-foreground">
                Based on your recent performance
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Saved</CardTitle>
              <Leaf className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{treesSaved}</div>
              <p className="text-xs text-muted-foreground">Equivalent trees saved</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Emissions Trend */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-success" />
                <span>Emissions Trend</span>
              </CardTitle>
              <CardDescription>Your carbon footprint over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={charts?.monthlyTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="emissions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="h-5 w-5 text-primary">📊</div>
                <span>Emissions by Category</span>
              </CardTitle>
              <CardDescription>Current month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={charts?.categoryBreakdown || []}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(charts?.categoryBreakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {(charts?.categoryBreakdown || []).map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {item.name} ({item.value}%)
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Challenge Stats */}
        {challengeStats && (
          <Card className="shadow-card border-border mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-warning" />
                <span>Challenge Performance</span>
              </CardTitle>
              <CardDescription>Your eco-challenge statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{challengeStats.completionRate}%</div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{challengeStats.perfectDays}</div>
                  <p className="text-sm text-muted-foreground">Perfect Days</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{challengeStats.completedChallenges}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{challengeStats.activeDays}</div>
                  <p className="text-sm text-muted-foreground">Active Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card border-border transition-all duration-300 ease-out hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/track")}>
            <CardHeader className="text-center">
              <Car className="h-12 w-12 text-primary mx-auto mb-2 " />
              <CardTitle>Log Today's Activity</CardTitle>
              <CardDescription>Track your daily carbon footprint</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-border transition-all duration-300 ease-out hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/home")}>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-warning mx-auto mb-2" />
              <CardTitle>Daily Challenges</CardTitle>
              <CardDescription>Complete eco-friendly challenges</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-border transition-all duration-300 ease-out hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/profile")}>
            <CardHeader className="text-center">
              <Award className="h-12 w-12 text-success mx-auto mb-2" />
              <CardTitle>View Progress</CardTitle>
              <CardDescription>Check your environmental journey</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* AI-Powered Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div className="mb-8">
            <RecommendationView
              recommendations={recommendations.map((rec, index) => ({
                id: `dashboard-rec-${index}`,
                title: rec.title,
                description: rec.description,
                category: rec.category === 'energy' ? 'home' : rec.category,
                estimatedSavings: rec.estimatedSavings || 0.5,
                priority: index + 1,
                source: 'ai_generated',
                actionable: true
              }))}
              footprintData={null}
              onRetry={async () => {
                try {
                  await refetchDashboard();
                  toast({
                    title: "Recommendations updated",
                    description: "New AI-powered recommendations have been generated.",
                  });
                } catch (error) {
                  toast({
                    title: "Update failed",
                    description: "Unable to generate new recommendations. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
            />
          </div>
        )}

    {/* Summary Stats */}
    {summary && (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Entries:</span>
                <span className="font-medium">{summary.totalEntries}</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Daily:</span>
                <span className="font-medium">{Math.round(summary.avgDailyFootprint * 100) / 100} kg</span>
              </div>
              {summary.bestDay && (
                <div className="flex justify-between">
                  <span>Best Day:</span>
                  <span className="font-medium text-success">
                    {Math.round(summary.bestDay.emissions * 100) / 100} kg
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Progress Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Monthly Target</span>
                  <span className="text-sm">
                    {Math.round((1 - currentEmissions / targetEmissions) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      currentEmissions <= targetEmissions ? 'bg-success' : 'bg-warning'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (currentEmissions / targetEmissions) * 100)}%` 
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Data Points:</span>
                <span className="font-medium">{summary.totalEntries}</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className={`font-medium ${
                  metrics?.trend === 'improving' ? 'text-success' : 'text-warning'
                }`}>
                  {metrics?.trend === 'improving' ? 'Improving' : 'Stable'}
                </span>
              </div>
              {challengeStats && (
                <div className="flex justify-between">
                  <span>Challenges:</span>
                  <span className="font-medium">{challengeStats.completionRate}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </main>
</div>
);
}