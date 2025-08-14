import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";
import { TrendingDown, TrendingUp, Target, Award, Leaf, Zap, Car, Utensils } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Jan", emissions: 2.3, savings: 0.5 },
  { month: "Feb", emissions: 2.1, savings: 0.7 },
  { month: "Mar", emissions: 1.9, savings: 0.9 },
  { month: "Apr", emissions: 1.7, savings: 1.1 },
  { month: "May", emissions: 1.5, savings: 1.3 },
  { month: "Jun", emissions: 1.3, savings: 1.5 },
];

const categoryData = [
  { name: "Transportation", value: 45, color: "hsl(var(--destructive))" },
  { name: "Energy", value: 30, color: "hsl(var(--warning))" },
  { name: "Food", value: 20, color: "hsl(var(--accent))" },
  { name: "Other", value: 5, color: "hsl(var(--muted-foreground))" },
];

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      navigate("/");
      return;
    }
    
    const storedName = localStorage.getItem("userName") || "Eco Warrior";
    setUserName(storedName);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    navigate("/");
  };

  const currentEmissions = 1.3; // tons CO2/month
  const targetEmissions = 1.0;
  const reductionPercentage = ((2.3 - currentEmissions) / 2.3 * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={true} onLogout={handleLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {userName}! 🌱
          </h1>
          <p className="text-muted-foreground">
            Here's your environmental impact dashboard for this month.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Emissions</CardTitle>
              <TrendingDown className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{currentEmissions} tons</div>
              <p className="text-xs text-success">-{reductionPercentage}% from last month</p>
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
                {currentEmissions > targetEmissions ? "23% above target" : "Target achieved!"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eco Score</CardTitle>
              <Award className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">847</div>
              <p className="text-xs text-success">+12 points this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trees Saved</CardTitle>
              <Leaf className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">24</div>
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
                <LineChart data={monthlyData}>
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
                <PieChart className="h-5 w-5 text-primary" />
                <span>Emissions by Category</span>
              </CardTitle>
              <CardDescription>Current month breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {categoryData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card border-border hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/track")}>
            <CardHeader className="text-center">
              <Car className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>Log Transportation</CardTitle>
              <CardDescription>Track your daily commute and travel</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-border hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/track")}>
            <CardHeader className="text-center">
              <Zap className="h-12 w-12 text-warning mx-auto mb-2" />
              <CardTitle>Energy Usage</CardTitle>
              <CardDescription>Monitor home energy consumption</CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-card border-border hover:shadow-elevated transition-smooth cursor-pointer" onClick={() => navigate("/track")}>
            <CardHeader className="text-center">
              <Utensils className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>Food & Diet</CardTitle>
              <CardDescription>Track your dietary carbon impact</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recommendations */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle>Personalized Recommendations</CardTitle>
            <CardDescription>Based on your current carbon footprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-success rounded-lg">
                <Car className="h-4 w-4 text-success-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Try carpooling 2 days per week</h4>
                <p className="text-sm text-muted-foreground">Could save up to 0.3 tons CO₂ monthly</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <div className="p-2 bg-warning rounded-lg">
                <Zap className="h-4 w-4 text-warning-foreground" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Switch to LED bulbs</h4>
                <p className="text-sm text-muted-foreground">Reduce home energy consumption by 15%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}