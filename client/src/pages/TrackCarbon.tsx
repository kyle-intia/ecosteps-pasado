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
import apiClient from "@/lib/apiClient";

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
    bicycleDistance: "",
    walkingDistance: "",
    
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
    bicycle: false,
    walking: false,
    noTransport: false,
  });

  const [checkedAppliances, setCheckedAppliances] = useState({
    aircon: false,
    laundry: false,
    none: false,
  });
  const [isLoadingToday, setIsLoadingToday] = useState(false);
  const [todayEntry, setTodayEntry] = useState<any>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  
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

  useEffect(() => {
    if (!isLoggedIn) return;
    const userId = localStorage.getItem("userId");
    if (!userId) return;

    const fetchToday = async () => {
      try {
        setIsLoadingToday(true);
        const res = await apiClient.getTodaysTracking(userId);
        setTodayEntry(res?.data || null);
      } catch (_e) {
        setTodayEntry(null);
      } finally {
        setIsLoadingToday(false);
      }
    };

    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const res = await apiClient.getDailyTrackingHistory(userId, 7, 0);
        setHistoryEntries(res?.data?.entries || []);
      } catch (_e) {
        setHistoryEntries([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchToday();
    fetchHistory();
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransportModeChange = (mode: string, isChecked: boolean) => {
    if (mode === "noTransport") {
      // If selecting "Didn't commute today", uncheck all other options
      if (isChecked) {
        setCheckedTransportModes({
          personalCar: false,
          publicTransport: false,
          motorcycle: false,
          bicycle: false,
          walking: false,
          noTransport: true,
        });
        
        // Clear all distance values
        setFormData(prev => ({
          ...prev,
          personalCarDistance: "",
          publicTransportDistance: "",
          motorcycleDistance: "",
          bicycleDistance: "",
          walkingDistance: "",
        }));
      } else {
        // If unchecking "Didn't commute today", just set it to false
        setCheckedTransportModes(prev => ({ ...prev, noTransport: false }));
      }
    } else {
      // If selecting any other option, make sure "noTransport" is unchecked
      setCheckedTransportModes(prev => ({
        ...prev,
        [mode]: isChecked,
        noTransport: false,
      }));
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

  const calculateFootprint = async () => {
    try {
      // Map UI selections to backend enums
      const modes: Array<{ id: string; distance?: number }> = [];
      const distances: Record<string, number> = {};

      const addMode = (key: string, backendId: string, distanceStr: string) => {
        const enabled = (checkedTransportModes as any)[key];
        if (!enabled) return;
        const km = Number(distanceStr || 0) || 0;
        modes.push({ id: backendId, distance: km });
        distances[backendId] = km;
      };

      if (checkedTransportModes.noTransport) {
        modes.push({ id: "no_travel", distance: 0 });
      } else {
        addMode("personalCar", "car", formData.personalCarDistance);
        addMode("publicTransport", "public_transport", formData.publicTransportDistance);
        addMode("motorcycle", "motorcycle", formData.motorcycleDistance);
        addMode("bicycle", "bicycle", formData.bicycleDistance);
        addMode("walking", "walking", formData.walkingDistance);
      }

      const flightsToday = formData.flightsToday || "none"; // long-haul | short-haul | none

      const homeType = formData.homeType; // large-house | small-house | apartment
      const occupants = Number(formData.houseSharing || 1) || 1;

      const appliances: string[] = [];
      if (checkedAppliances.none) {
        appliances.push("none");
      } else {
        if (checkedAppliances.aircon) appliances.push("aircon");
        if (checkedAppliances.laundry) appliances.push("laundry");
      }

      const mapMeal = (value: string) => value || "none"; // backend normalizes 'none'->'skipped'
      const food = {
        breakfast: mapMeal(formData.breakfastType),
        lunch: mapMeal(formData.lunchType),
        dinner: mapMeal(formData.dinnerType),
      };

      // Build payload expected by backend
      const userId = localStorage.getItem("userId") || "000000000000000000000000";
      const payload = {
        userId,
        transport: { modes, distances },
        flightsToday,
        homeEnergy: { homeType, occupants, appliances },
        food,
      };

      const result = await apiClient.submitDailyTracking(payload);
    
    toast({
        title: "Daily tracking saved",
        description: `Total: ${result?.data?.calculatedFootprint?.total ?? "-"} kg CO₂e`,
    });
    
    navigate("/dashboard");
    } catch (error: any) {
      const message = error?.message || "Failed to submit tracking";
      toast({
        title: "Submission failed",
        description: message,
      });
    }
  };

  const stepTitles = [
    "Transportation",
    "Home Energy", 
    "Food & Lifestyle"
  ];

  const progress = (currentStep / 3) * 100;

  // Check if "Didn't commute today" is selected
  const isNoTransportSelected = checkedTransportModes.noTransport;
  
  // Check if "None" is selected for appliances
  const isNoApplianceSelected = checkedAppliances.none;

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
                      disabled={isNoTransportSelected}
                    />
                    <Label 
                      htmlFor="personalCar" 
                      className={`flex-1 ${isNoTransportSelected ? "text-muted-foreground" : ""}`}
                    >
                      Personal Car
                    </Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.personalCarDistance}
                      onChange={(e) => handleDistanceChange("personalCar", e.target.value)}
                      disabled={!checkedTransportModes.personalCar || isNoTransportSelected}
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
                      disabled={isNoTransportSelected}
                    />
                    <Label 
                      htmlFor="publicTransport" 
                      className={`flex-1 ${isNoTransportSelected ? "text-muted-foreground" : ""}`}
                    >
                      Public Transportation
                    </Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.publicTransportDistance}
                      onChange={(e) => handleDistanceChange("publicTransport", e.target.value)}
                      disabled={!checkedTransportModes.publicTransport || isNoTransportSelected}
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
                      disabled={isNoTransportSelected}
                    />
                    <Label 
                      htmlFor="motorcycle" 
                      className={`flex-1 ${isNoTransportSelected ? "text-muted-foreground" : ""}`}
                    >
                      Motorcycle
                    </Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.motorcycleDistance}
                      onChange={(e) => handleDistanceChange("motorcycle", e.target.value)}
                      disabled={!checkedTransportModes.motorcycle || isNoTransportSelected}
                    />
                  </div>

                  {/* Bicycle/E-bike */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="bicycle"
                      className="w-4 h-4"
                      checked={checkedTransportModes.bicycle}
                      onChange={(e) => handleTransportModeChange("bicycle", e.target.checked)}
                      disabled={isNoTransportSelected}
                    />
                    <Label 
                      htmlFor="bicycle" 
                      className={`flex-1 ${isNoTransportSelected ? "text-muted-foreground" : ""}`}
                    >
                      Bicycle / E-bike
                    </Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.bicycleDistance}
                      onChange={(e) => handleDistanceChange("bicycle", e.target.value)}
                      disabled={!checkedTransportModes.bicycle || isNoTransportSelected}
                    />
                  </div>

                  {/* Walking */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="walking"
                      className="w-4 h-4"
                      checked={checkedTransportModes.walking}
                      onChange={(e) => handleTransportModeChange("walking", e.target.checked)}
                      disabled={isNoTransportSelected}
                    />
                    <Label 
                      htmlFor="walking" 
                      className={`flex-1 ${isNoTransportSelected ? "text-muted-foreground" : ""}`}
                    >
                      Walking
                    </Label>
                    <Input
                      type="number"
                      placeholder="km"
                      className="w-20"
                      value={formData.walkingDistance}
                      onChange={(e) => handleDistanceChange("walking", e.target.value)}
                      disabled={!checkedTransportModes.walking || isNoTransportSelected}
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
                    <Label htmlFor="noTransport" className="flex-1">Didn't commute today</Label>
                    {/* Removed Input for noTransport as it's not needed */}
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
                    <SelectItem value="long-haul">Yes, long-haul (More than 3 hours)</SelectItem>
                    <SelectItem value="short-haul">Yes, short-haul (Less than 3 hours)</SelectItem>
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
                    <SelectItem value="large-house">Large House (3 or more bedrooms)</SelectItem>
                    <SelectItem value="small-house">Small House (2 or less bedrooms)</SelectItem>
                    <SelectItem value="apartment">Apartment/Condo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="houseSharing">Q4. With how many people did you share your house today?</Label>
                <Input
                  id="houseSharing"
                  type="number"
                  value={formData.houseSharing}
                  onChange={(e) => handleInputChange("houseSharing", e.target.value)}
                  placeholder="Enter number of people (including yourself)"

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
                      disabled={isNoApplianceSelected}
                    />
                    <Label 
                      htmlFor="aircon" 
                      className={`flex-1 ${isNoApplianceSelected ? "text-muted-foreground" : ""}`}
                    >
                      Air Conditioning / Heating Systems
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="laundry" 
                      className="w-4 h-4" 
                      checked={checkedAppliances.laundry}
                      onChange={(e) => handleApplianceChange("laundry", e.target.checked)}
                      disabled={isNoApplianceSelected}
                    />
                    <Label 
                      htmlFor="laundry" 
                      className={`flex-1 ${isNoApplianceSelected ? "text-muted-foreground" : ""}`}
                    >
                      Laundry Machine
                    </Label>
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
                    <SelectItem value="meat">🥩 Meat-based (bacon, hotdogs, sausage)</SelectItem>
                    <SelectItem value="fish">🐟 Fish-based (salmon, tuna, shrimp)</SelectItem>
                    <SelectItem value="plant-based">🥗 Plant-based (fruits, grains)</SelectItem>
                    <SelectItem value="dairy">🥛 Dairy (milk, yogurt, eggs)</SelectItem>
                    <SelectItem value="mixed">🍽️ Mixed (combination of categories)</SelectItem>
                    <SelectItem value="none">🚫 Skipped breakfast</SelectItem>
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
                    <SelectItem value="meat">🥩 Meat-based (bacon, hotdogs, sausage)</SelectItem>
                    <SelectItem value="fish">🐟 Fish-based (salmon, tuna, shrimp)</SelectItem>
                    <SelectItem value="plant-based">🥗 Plant-based (fruits, grains)</SelectItem>
                    <SelectItem value="dairy">🥛 Dairy (milk, yogurt, eggs)</SelectItem>
                    <SelectItem value="mixed">🍽️ Mixed (combination of categories)</SelectItem>
                    <SelectItem value="none">🚫 Skipped lunch</SelectItem>
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
                    <SelectItem value="meat">🥩 Meat-based (bacon, hotdogs, sausage)</SelectItem>
                    <SelectItem value="fish">🐟 Fish-based (salmon, tuna, shrimp)</SelectItem>
                    <SelectItem value="plant-based">🥗 Plant-based (fruits, grains)</SelectItem>
                    <SelectItem value="dairy">🥛 Dairy (milk, yogurt, eggs)</SelectItem>
                    <SelectItem value="mixed">🍽️ Mixed (combination of categories)</SelectItem>
                    <SelectItem value="none">🚫 Skipped dinner</SelectItem>
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
      {/* Today's Entry Summary */}
      <div className="mt-10 grid grid-cols-1 gap-6">
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              Today's Entry
            </CardTitle>
            <CardDescription>
              {isLoadingToday ? "Loading today's entry..." : todayEntry ? `Date: ${todayEntry.date}` : 'No entry for today'}
            </CardDescription>
          </CardHeader>
          {todayEntry && (
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Transport</span><span>{todayEntry.calculatedFootprint?.transport ?? '-'} kg</span></div>
              <div className="flex justify-between"><span>Home Energy</span><span>{todayEntry.calculatedFootprint?.homeEnergy ?? '-'} kg</span></div>
              <div className="flex justify-between"><span>Food</span><span>{todayEntry.calculatedFootprint?.food ?? '-'} kg</span></div>
              <div className="flex justify-between font-medium"><span>Total</span><span>{todayEntry.calculatedFootprint?.total ?? '-'} kg</span></div>
            </CardContent>
          )}
        </Card>

        {/* Recent History */}
        <Card className="shadow-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-6 w-6 text-muted-foreground" />
              Recent History (7 days)
            </CardTitle>
            <CardDescription>
              {isLoadingHistory ? 'Loading history...' : `Entries: ${historyEntries.length}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {historyEntries.length === 0 && !isLoadingHistory && (
                <div className="text-muted-foreground">No recent entries</div>
              )}
              {historyEntries.map((e) => (
                <div key={e.id} className="flex justify-between">
                  <span>{e.date}{e.isToday ? ' (Today)' : ''}</span>
                  <span>{(e.footprint && e.footprint.total) ?? e.footprint ?? '-'} kg</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </main>
    </div>
  );
};

export default TrackCarbon;
