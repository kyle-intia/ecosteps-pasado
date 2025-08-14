import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navbar } from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import { Car, Zap, Utensils, Plane, Home, TrendingDown, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TrackCarbon = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Transportation
    dailyCommute: "",
    commuteMethod: "",
    weeklyDriving: "",
    flightsPerYear: "",
    
    // Energy
    homeSize: "",
    electricityBill: "",
    heatingType: "",
    
    // Food
    dietType: "",
    localFood: "",
    foodWaste: "",
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (!loggedIn) {
      navigate("/");
      return;
    }
    setIsLoggedIn(true);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateFootprint = () => {
    // Simple calculation for demo purposes
    const transportScore = parseInt(formData.weeklyDriving || "0") * 0.4;
    const energyScore = parseInt(formData.electricityBill || "0") * 0.005;
    const flightScore = parseInt(formData.flightsPerYear || "0") * 0.3;
    
    const totalFootprint = (transportScore + energyScore + flightScore).toFixed(1);
    
    // Store results
    localStorage.setItem("currentFootprint", totalFootprint);
    localStorage.setItem("lastTrackingDate", new Date().toISOString());
    
    toast({
      title: "Carbon Footprint Calculated!",
      description: `Your monthly carbon footprint is ${totalFootprint} tons CO₂`,
    });
    
    navigate("/dashboard");
  };

  const stepTitles = [
    "Transportation",
    "Home Energy", 
    "Food & Lifestyle"
  ];

  const progress = (currentStep / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
            <Calculator className="h-8 w-8 text-primary" />
            Track Your Carbon Footprint
          </h1>
          <p className="text-muted-foreground">
            Answer these questions to calculate your current environmental impact
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="shadow-card border-border mb-8">
          <CardHeader>
            <div className="flex justify-between items-center mb-2">
              <CardTitle className="text-lg">Step {currentStep} of 3: {stepTitles[currentStep - 1]}</CardTitle>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
        </Card>

        {/* Step 1: Transportation */}
        {currentStep === 1 && (
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                Transportation Habits
              </CardTitle>
              <CardDescription>Tell us about your daily travel patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dailyCommute">Daily commute distance (km)</Label>
                <Input
                  id="dailyCommute"
                  type="number"
                  placeholder="e.g., 25"
                  value={formData.dailyCommute}
                  onChange={(e) => handleInputChange("dailyCommute", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commuteMethod">Primary commute method</Label>
                <Select value={formData.commuteMethod} onValueChange={(value) => handleInputChange("commuteMethod", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary transportation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="car">Personal Car</SelectItem>
                    <SelectItem value="public">Public Transport</SelectItem>
                    <SelectItem value="bike">Bicycle</SelectItem>
                    <SelectItem value="walk">Walking</SelectItem>
                    <SelectItem value="hybrid">Mixed Transportation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weeklyDriving">Weekly driving distance (km)</Label>
                <Input
                  id="weeklyDriving"
                  type="number"
                  placeholder="e.g., 200"
                  value={formData.weeklyDriving}
                  onChange={(e) => handleInputChange("weeklyDriving", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flightsPerYear">Number of flights per year</Label>
                <Input
                  id="flightsPerYear"
                  type="number"
                  placeholder="e.g., 4"
                  value={formData.flightsPerYear}
                  onChange={(e) => handleInputChange("flightsPerYear", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Energy */}
        {currentStep === 2 && (
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-warning" />
                Home Energy Usage
              </CardTitle>
              <CardDescription>Information about your home energy consumption</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="homeSize">Home size (square meters)</Label>
                <Input
                  id="homeSize"
                  type="number"
                  placeholder="e.g., 120"
                  value={formData.homeSize}
                  onChange={(e) => handleInputChange("homeSize", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="electricityBill">Monthly electricity bill (USD)</Label>
                <Input
                  id="electricityBill"
                  type="number"
                  placeholder="e.g., 150"
                  value={formData.electricityBill}
                  onChange={(e) => handleInputChange("electricityBill", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="heatingType">Primary heating source</Label>
                <Select value={formData.heatingType} onValueChange={(value) => handleInputChange("heatingType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select heating type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Natural Gas</SelectItem>
                    <SelectItem value="electric">Electric</SelectItem>
                    <SelectItem value="oil">Oil</SelectItem>
                    <SelectItem value="solar">Solar/Renewable</SelectItem>
                    <SelectItem value="heat-pump">Heat Pump</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Food & Lifestyle */}
        {currentStep === 3 && (
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-6 w-6 text-accent" />
                Food & Lifestyle
              </CardTitle>
              <CardDescription>Your dietary habits and lifestyle choices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="dietType">Diet type</Label>
                <Select value={formData.dietType} onValueChange={(value) => handleInputChange("dietType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your diet type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="omnivore">Omnivore</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="pescatarian">Pescatarian</SelectItem>
                    <SelectItem value="low-meat">Low Meat</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="localFood">Percentage of locally sourced food</Label>
                <Select value={formData.localFood} onValueChange={(value) => handleInputChange("localFood", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How much of your food is local?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-low">Less than 10%</SelectItem>
                    <SelectItem value="low">10-30%</SelectItem>
                    <SelectItem value="medium">30-50%</SelectItem>
                    <SelectItem value="high">50-70%</SelectItem>
                    <SelectItem value="very-high">More than 70%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="foodWaste">Food waste level</Label>
                <Select value={formData.foodWaste} onValueChange={(value) => handleInputChange("foodWaste", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="How much food do you waste?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="very-low">Very Little (0-5%)</SelectItem>
                    <SelectItem value="low">Low (5-15%)</SelectItem>
                    <SelectItem value="medium">Average (15-25%)</SelectItem>
                    <SelectItem value="high">High (25-40%)</SelectItem>
                    <SelectItem value="very-high">Very High (40%+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          
          {currentStep < 3 ? (
            <Button onClick={nextStep}>Next Step</Button>
          ) : (
            <Button onClick={calculateFootprint} className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Calculate My Footprint
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default TrackCarbon;