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
    transportModes: [],
    flightsToday: "",
    personalCarDistance: "",
    publicTransportDistance: "",
    motorcycleDistance: "",
    walkingBikeDistance: "",
    noTransportDistance: "",
    
    // Home Energy
    homeType: "",
    houseSharing: "",
    highEnergyAppliances: [],
    
    // Food
    breakfastType: "",
    lunchType: "",
    dinnerType: "",
  });

  const [checkedTransportModes, setCheckedTransportModes] = useState({
    personalCar: false,
    publicTransport: false,
    motorcycle: false,
    walkingBike: false,
    noTransport: false,
  });

  const [checkedAppliances, setCheckedAppliances] = useState({
    aircon: false,
    heating: false,
    laundry: false,
    none: false,
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

  const handleTransportModeChange = (mode: string, isChecked: boolean) => {
    setCheckedTransportModes(prev => ({ ...prev, [mode]: isChecked }));
    
    // If unchecking, clear the distance value
    if (!isChecked) {
      const distanceField = `${mode}Distance`;
      setFormData(prev => ({ ...prev, [distanceField]: "" }));
    }
  };

  const handleDistanceChange = (mode: string, value: string) => {
    const distanceField = `${mode}Distance`;
    setFormData(prev => ({ ...prev, [distanceField]: value }));
  };

  const handleApplianceChange = (appliance: string, isChecked: boolean) => {
    if (appliance === "none") {
      // If "none" is being checked, uncheck all other appliances
      if (isChecked) {
        setCheckedAppliances({
          aircon: false,
          heating: false,
          laundry: false,
          none: true,
        });
      } else {
        // If "none" is being unchecked, just set none to false
        setCheckedAppliances(prev => ({ ...prev, none: false }));
      }
    } else {
      // If any other appliance is checked, make sure "none" is unchecked
      setCheckedAppliances(prev => ({
        ...prev,
        [appliance]: isChecked,
        none: false,
      }));
    }
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
    // TODO: Implement calculation with new CO₂ factors
    // This will be updated after implementing the new form structure
    const totalFootprint = "0.0";
    
    // Store results
    localStorage.setItem("currentFootprint", totalFootprint);
    localStorage.setItem("lastTrackingDate", new Date().toISOString());
    
    toast({
      title: "Carbon Footprint Calculated!",
      description: `Your daily carbon footprint is ${totalFootprint} tons CO₂`,
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
                Transport & Travel (Daily)
              </CardTitle>
              <CardDescription>Tell us about your daily travel patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Q1: Transportation Modes */}
              <div className="space-y-4">
                <Label>Q1. What is/are your mode(s) of transportation for daily commute? (Check all that apply)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Personal Car */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="personalCar"
                      className="w-4 h-4"
                      checked={checkedTransportModes.personalCar}
                      onChange={(e) => handleTransportModeChange("personalCar", e.target.checked)}
                    />
                    <Label htmlFor="personalCar" className="flex-1">Personal Car</Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.personalCarDistance}
                      onChange={(e) => handleDistanceChange("personalCar", e.target.value)}
                      disabled={!checkedTransportModes.personalCar}
                    />
                  </div>

                  {/* Public Transportation */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="publicTransport"
                      className="w-4 h-4"
                      checked={checkedTransportModes.publicTransport}
                      onChange={(e) => handleTransportModeChange("publicTransport", e.target.checked)}
                    />
                    <Label htmlFor="publicTransport" className="flex-1">Public Transportation</Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.publicTransportDistance}
                      onChange={(e) => handleDistanceChange("publicTransport", e.target.value)}
                      disabled={!checkedTransportModes.publicTransport}
                    />
                  </div>

                  {/* Motorcycle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="motorcycle"
                      className="w-4 h-4"
                      checked={checkedTransportModes.motorcycle}
                      onChange={(e) => handleTransportModeChange("motorcycle", e.target.checked)}
                    />
                    <Label htmlFor="motorcycle" className="flex-1">Motorcycle</Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.motorcycleDistance}
                      onChange={(e) => handleDistanceChange("motorcycle", e.target.value)}
                      disabled={!checkedTransportModes.motorcycle}
                    />
                  </div>

                  {/* Walking/Bicycle/E-bike */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="walkingBike"
                      className="w-4 h-4"
                      checked={checkedTransportModes.walkingBike}
                      onChange={(e) => handleTransportModeChange("walkingBike", e.target.checked)}
                    />
                    <Label htmlFor="walkingBike" className="flex-1">Walking / Bicycle / E-bike</Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.walkingBikeDistance}
                      onChange={(e) => handleDistanceChange("walkingBike", e.target.value)}
                      disabled={!checkedTransportModes.walkingBike}
                    />
                  </div>

                  {/* No Transport */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="noTransport"
                      className="w-4 h-4"
                      checked={checkedTransportModes.noTransport}
                      onChange={(e) => handleTransportModeChange("noTransport", e.target.checked)}
                    />
                    <Label htmlFor="noTransport" className="flex-1">No Transport</Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.noTransportDistance}
                      onChange={(e) => handleDistanceChange("noTransport", e.target.value)}
                      disabled={!checkedTransportModes.noTransport}
                    />
                  </div>
                </div>
              </div>

              {/* Q2: Flights */}
              <div className="space-y-2">
                <Label htmlFor="flightsToday">Q2. Did you take any flights today?</Label>
                <Select value={formData.flightsToday} onValueChange={(value) => handleInputChange("flightsToday", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flight option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-haul">Yes, short-haul (less than 3 hours) → 0.3 t</SelectItem>
                    <SelectItem value="long-haul">Yes, long-haul (more than 3 hours) → 0.6 t</SelectItem>
                    <SelectItem value="none">No</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label htmlFor="homeType">Q3. What type of home do you live in?</Label>
                <Select value={formData.homeType} onValueChange={(value) => handleInputChange("homeType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select home type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment/Condo → 0.2 t</SelectItem>
                    <SelectItem value="small-house">Small House (less than 100m²) → 0.4 t</SelectItem>
                    <SelectItem value="medium-house">Medium House (100-200m²) → 0.6 t</SelectItem>
                    <SelectItem value="large-house">Large House (more than 200m²) → 0.8 t</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="houseSharing">Q4. With how many people did share your house with today? (Probably you can type the number)</Label>
                <Input
                  id="houseSharing"
                  type="number"
                  value={formData.houseSharing}
                  onChange={(e) => handleInputChange("houseSharing", e.target.value)}
                  placeholder="Enter number of people"
                />
              </div>

              <div className="space-y-4">
                <Label>Q5. Which high-energy appliances did you use today? (Check all that apply)</Label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="aircon" 
                      className="w-4 h-4" 
                      checked={checkedAppliances.aircon}
                      onChange={(e) => handleApplianceChange("aircon", e.target.checked)}
                      disabled={checkedAppliances.none}
                    />
                    <Label htmlFor="aircon" className="flex-1">Air Conditioning</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="heating" 
                      className="w-4 h-4" 
                      checked={checkedAppliances.heating}
                      onChange={(e) => handleApplianceChange("heating", e.target.checked)}
                      disabled={checkedAppliances.none}
                    />
                    <Label htmlFor="heating" className="flex-1">Heating System</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="laundry" 
                      className="w-4 h-4" 
                      checked={checkedAppliances.laundry}
                      onChange={(e) => handleApplianceChange("laundry", e.target.checked)}
                      disabled={checkedAppliances.none}
                    />
                    <Label htmlFor="laundry" className="flex-1">Laundry Machine</Label>
                  </div>

                

                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="none" 
                      className="w-4 h-4" 
                      checked={checkedAppliances.none}
                      onChange={(e) => handleApplianceChange("none", e.target.checked)}
                    />
                    <Label htmlFor="none" className="flex-1">None</Label>
                  </div>
                </div>
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
                <Label htmlFor="breakfastType">Q6. What did you have for breakfast today?</Label>
                <Select value={formData.breakfastType} onValueChange={(value) => handleInputChange("breakfastType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select breakfast type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant-based">Plant-based (fruits, grains) → 0.1 t</SelectItem>
                    <SelectItem value="dairy">Dairy (milk, yogurt, eggs) → 0.2 t</SelectItem>
                    <SelectItem value="meat">Meat-based (bacon, sausage) → 0.4 t</SelectItem>
                    <SelectItem value="none">Skipped breakfast → 0 t</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lunchType">Q7. What did you have for lunch today?</Label>
                <Select value={formData.lunchType} onValueChange={(value) => handleInputChange("lunchType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lunch type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant-based">Plant-based (salad, vegetables) → 0.2 t</SelectItem>
                    <SelectItem value="dairy">Dairy (cheese, dairy products) → 0.3 t</SelectItem>
                    <SelectItem value="meat">Meat-based (beef, chicken, fish) → 0.5 t</SelectItem>
                    <SelectItem value="none">Skipped lunch → 0 t</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dinnerType">Q8. What did you have for dinner today?</Label>
                <Select value={formData.dinnerType} onValueChange={(value) => handleInputChange("dinnerType", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dinner type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plant-based">Plant-based (vegetables, grains) → 0.2 t</SelectItem>
                    <SelectItem value="dairy">Dairy (cheese, dairy products) → 0.3 t</SelectItem>
                    <SelectItem value="meat">Meat-based (beef, chicken, fish) → 0.5 t</SelectItem>
                    <SelectItem value="none">Skipped dinner → 0 t</SelectItem>
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
