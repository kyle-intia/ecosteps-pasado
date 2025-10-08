// client/src/pages/TrackCarbon.tsx
// Enhanced with AI Recommendation workflow integration

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Navbar } from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import { Car, Zap, Utensils, Plane, Home, TrendingDown, Calculator, AlertTriangle, RotateCcw, Sparkles, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { logout, getTodaysTracking, getDailyTrackingHistory, submitDailyTracking } from "../lib/api";
import queryClient from "../config/queryClient";
import useSessions from "../hooks/useSessions";
import useAuth from "../hooks/useAuth";
import RecommendationView from "../components/RecommendationView";
import LoadingSpinner from "../components/LoadingSpinner";

// Types for AI recommendations
interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'transport' | 'home' | 'food' | 'general';
  estimatedSavings: number;
  priority: number;
  source: 'ai_generated' | 'rule_based' | 'hybrid';
  actionable: boolean;
}

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: 'daily' | 'challenge' | 'carbon' | 'transport' | 'home' | 'food';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon: string;
  targetValue: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  isEquipped: boolean;
  profilePriority: number;
}

interface FootprintResponse {
  success: boolean;
  data: {
    id: string;
    footprintId: string;
    isUpdate: boolean;
    calculatedFootprint: {
      transport: number;
      homeEnergy: number;
      food: number;
      total: number;
    };
    breakdown: {
      transport: number;
      homeEnergy: number;
      food: number;
      total: number;
    };
    newAchievements?: Achievement[];
  };
}

interface RecommendationResponse {
  success: boolean;
  data: {
    recommendations: Recommendation[];
    footprintSummary: {
      total: number;
      transport: number;
      homeEnergy: number;
      food: number;
      date: string;
    };
    cached: boolean;
    generatedAt: string;
    processingTime?: number;
  };
}

const TrackCarbon = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  
  // AI Recommendations state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [footprintData, setFootprintData] = useState<FootprintResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Existing form state
  const [formData, setFormData] = useState({
    transportModes: [],
    flightsToday: "",
    personalCarDistance: "",
    publicTransportDistance: "",
    motorcycleDistance: "",
    bicycleDistance: "",
    walkingDistance: "",
    homeType: "",
    houseSharing: "",
    highEnergyAppliances: [],
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
  const { sessions, isPending, isError } = useSessions();
  
  useEffect(() => {
    if (!isPending && sessions.length > 0) {
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        setIsLoggedIn(loggedIn);
    }

    if (!isPending && (isError || sessions.length === 0)) {
      localStorage.removeItem("isLoggedIn");
      navigate("/", { replace: true });
    }
  }, [isPending, isError, sessions, navigate]);

  // Check for existing session data on component mount
  useEffect(() => {
    const sessionFootprintId = localStorage.getItem('current_footprint_id');
    const sessionRecommendations = localStorage.getItem('current_recommendations');
    const sessionFootprintData = localStorage.getItem('current_footprint_data');

    if (sessionFootprintId && sessionRecommendations && sessionFootprintData) {
      try {
        const parsedRecommendations = JSON.parse(sessionRecommendations);
        const parsedFootprintData = JSON.parse(sessionFootprintData);
        setRecommendations(parsedRecommendations);
        setFootprintData(parsedFootprintData);
        setIsSubmitted(true);
        setLoadingStatus('success');
        console.log('Restored session state with', parsedRecommendations.length, 'recommendations and footprint data');
      } catch (error) {
        console.error('Error parsing session data:', error);
        // Clear invalid session data
        localStorage.removeItem('current_footprint_id');
        localStorage.removeItem('current_recommendations');
        localStorage.removeItem('current_footprint_data');
      }
    }
  }, []);

  const { mutate: signOut } = useMutation({
    mutationFn: logout,
    onSettled: () => {
      localStorage.clear();
      queryClient.clear(); 
      navigate("/login", { replace: true }); 
    },
  });

  const { user } = useAuth() as { user: { _id?: string } };

  useEffect(() => {
    if (!isLoggedIn || isSubmitted) return; // Skip if already showing recommendations
    const userId = user?._id;
    if (!userId) return;

    const fetchToday = async () => {
      try {
        setIsLoadingToday(true);
        const res = await getTodaysTracking();
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
        const res = await getDailyTrackingHistory(7, 0);
        setHistoryEntries(res?.data?.entries || []);
      } catch (_e) {
        setHistoryEntries([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchToday();
    fetchHistory();
  }, [isLoggedIn, user, isSubmitted]);

  const handleSignOut = () => {
    signOut();
  };

  // API call functions
  const submitFootprint = async (trackingData: any): Promise<FootprintResponse> => {
    const response = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/footprint/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(trackingData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to submit footprint');
    }

    return response.json();
  };

  const fetchRecommendations = async (footprintId: string): Promise<RecommendationResponse> => {
    const response = await fetch('/api/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ footprintId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch recommendations');
    }

    return response.json();
  };

  const resetDailyData = async (): Promise<void> => {
    const response = await fetch('/api/footprint/reset-daily', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reset daily data');
    }
  };

  // Form submission handler with AI workflow
  const handleFormSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    try {
      console.log('Starting footprint submission and AI recommendation flow');
      setLoadingStatus('loading');
      setErrorMessage(null);

      // Build payload for API
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
        modes.push({ id: "no_travel" });
      } else {
        addMode("personalCar", "car", formData.personalCarDistance);
        addMode("publicTransport", "public_transport", formData.publicTransportDistance);
        addMode("motorcycle", "motorcycle", formData.motorcycleDistance);
        addMode("bicycle", "bicycle", formData.bicycleDistance);
        addMode("walking", "walking", formData.walkingDistance);
      }

      const flightsToday = formData.flightsToday || "none";
      let mappedHomeType = formData.homeType;
      if (mappedHomeType === "large-house") {
        mappedHomeType = "large_house";
      } else if (mappedHomeType === "small-house") {
        mappedHomeType = "small_house";
      }

      const occupants = Number(formData.houseSharing || 1) || 1;
      const appliances: string[] = [];
      if (checkedAppliances.none) {
        appliances.push("none");
      } else {
        if (checkedAppliances.aircon) appliances.push("aircon");
        if (checkedAppliances.laundry) appliances.push("laundry");
      }

      const mapMeal = (value: string) => value || "skipped";
      const food = {
        breakfast: mapMeal(formData.breakfastType),
        lunch: mapMeal(formData.lunchType),
        dinner: mapMeal(formData.dinnerType),
      };

      const payload = {
        transport: { modes, distances },
        flightsToday,
        homeEnergy: { homeType: mappedHomeType, occupants, appliances },
        food,
      };

      // Step 1: Submit footprint data
      const footprintResponse = await submitFootprint(payload);
      console.log('Footprint submitted successfully:', footprintResponse.data.footprintId);

      setFootprintData(footprintResponse.data);

      // Store footprint data in localStorage for persistence
      localStorage.setItem('current_footprint_data', JSON.stringify(footprintResponse.data));

      // Step 2: Fetch AI recommendations
      const recommendationResponse = await fetchRecommendations(footprintResponse.data.footprintId);
      console.log('AI recommendations received:', recommendationResponse.data.recommendations.length, 'items');

      // Update state with successful results
      setRecommendations(recommendationResponse.data.recommendations);
      setIsSubmitted(true);
      setLoadingStatus('success');

      // Store in localStorage for persistence
      localStorage.setItem('current_footprint_id', footprintResponse.data.footprintId);
      localStorage.setItem('current_recommendations', JSON.stringify(recommendationResponse.data.recommendations));

      // Show success toast
      toast({
        title: "Carbon footprint calculated!",
        description: `Total: ${footprintResponse.data.calculatedFootprint.total} kg CO₂e. AI recommendations generated.`,
      });

    } catch (error: any) {
      console.error('Error in footprint submission or recommendation generation:', error);
      setLoadingStatus('error');
      setErrorMessage(error.message || 'Failed to process your request. Please try again.');
      
      toast({
        title: "Error",
        description: error.message || "Failed to process your carbon footprint. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Edit footprint handler with reset warning
  const handleEditFootprint = async () => {
    const confirmReset = window.confirm(
      "⚠️ Warning: Editing your footprint will reset today's carbon tracking and uncheck all completed eco-challenges. Do you want to continue?"
    );

    if (!confirmReset) {
      return;
    }

    try {
      console.log('Resetting daily data and returning to form');
      await resetDailyData();

      // Reset frontend state
      setIsSubmitted(false);
      setRecommendations([]);
      setFootprintData(null);
      setLoadingStatus('idle');
      setErrorMessage(null);
      setCurrentStep(1);

      // Clear localStorage
      localStorage.removeItem('current_footprint_id');
      localStorage.removeItem('current_recommendations');
      localStorage.removeItem('current_footprint_data');

      toast({
        title: "Daily data reset",
        description: "Your carbon tracking and eco-challenges have been reset. You can now enter new data.",
      });

    } catch (error: any) {
      console.error('Error resetting daily data:', error);
      toast({
        title: "Reset failed",
        description: error.message || "Failed to reset your daily data. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Retry AI recommendations
  const handleRetryRecommendations = async () => {
    if (!footprintData) {
      toast({
        title: "Error",
        description: "No footprint data available. Please submit your footprint first.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoadingStatus('loading');
      setErrorMessage(null);

      const recommendationResponse = await fetchRecommendations(footprintData.footprintId);
      setRecommendations(recommendationResponse.data.recommendations);
      setLoadingStatus('success');

      // Update localStorage
      localStorage.setItem('current_recommendations', JSON.stringify(recommendationResponse.data.recommendations));

      toast({
        title: "Recommendations updated",
        description: `Generated ${recommendationResponse.data.recommendations.length} new recommendations for you.`,
      });

    } catch (error: any) {
      console.error('Error retrying recommendations:', error);
      setLoadingStatus('error');
      setErrorMessage(error.message || 'Failed to generate recommendations. Please try again.');
    }
  };

  // Existing form handlers (unchanged)
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTransportModeChange = (mode: string, isChecked: boolean) => {
    if (mode === "noTransport") {
      if (isChecked) {
        setCheckedTransportModes({
          personalCar: false,
          publicTransport: false,
          motorcycle: false,
          bicycle: false,
          walking: false,
          noTransport: true,
        });
        
        setFormData(prev => ({
          ...prev,
          personalCarDistance: "",
          publicTransportDistance: "",
          motorcycleDistance: "",
          bicycleDistance: "",
          walkingDistance: "",
        }));
      } else {
        setCheckedTransportModes(prev => ({ ...prev, noTransport: false }));
      }
    } else {
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

  // Prevent form submission when pressing Enter in inputs on Steps 1-2
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentStep < 3) {
      e.preventDefault();
      // Optionally advance to next step if on Step 1 or 2
      if (currentStep < 3) {
        nextStep();
      }
    }
  };

  const handleApplianceChange = (appliance: string, isChecked: boolean) => {
    if (appliance === "none") {
      if (isChecked) {
        setCheckedAppliances({
          aircon: false,
          laundry: false,
          none: true,
        });
      } else {
        setCheckedAppliances(prev => ({ ...prev, none: false }));
      }
    } else {
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

  const stepTitles = [
    "Transportation",
    "Home Energy", 
    "Food & Lifestyle"
  ];

  const progress = (currentStep / 3) * 100;
  const isNoTransportSelected = checkedTransportModes.noTransport;
  const isNoApplianceSelected = checkedAppliances.none;

  // Show loading spinner during initial auth check
  if (isPending) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar isLoggedIn={isLoggedIn} onLogout={handleSignOut} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isSubmitted ? (
          // FORM VIEW - Original form interface
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Calculator className="h-8 w-8 text-primary" />
                Track Your Carbon Footprint
              </h1>
              <p className="text-muted-foreground">
                Answer these questions to calculate your environmental impact and get AI-powered recommendations
              </p>
            </div>

            {todayEntry && (
              <Alert className="mb-6 border-warning bg-warning/10">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Existing Entry Found</AlertTitle>
                <AlertDescription>
                  You already have a tracking entry for today ({todayEntry.calculatedFootprint?.total || '-'} kg CO₂e). 
                  Submitting new data will update your footprint and may reset completed eco-challenges.
                </AlertDescription>
              </Alert>
            )}

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

            {/* Form Steps - Same as original but wrapped in form */}
            <form onSubmit={handleFormSubmit}>
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
                        </div>
                      </div>
                    </div>

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
                        onKeyDown={handleInputKeyDown}
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
                          <SelectItem value="meat">Meat-based (bacon, hotdogs, sausage)</SelectItem>
                          <SelectItem value="fish">Fish-based (salmon, tuna, shrimp)</SelectItem>
                          <SelectItem value="plant">Plant-based (fruits, grains)</SelectItem>
                          <SelectItem value="dairy">Dairy (milk, yogurt, eggs)</SelectItem>
                          <SelectItem value="mixed">Mixed (combination of categories)</SelectItem>
                          <SelectItem value="skipped">Skipped breakfast</SelectItem>
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
                          <SelectItem value="meat">Meat-based (bacon, hotdogs, sausage)</SelectItem>
                          <SelectItem value="fish">Fish-based (salmon, tuna, shrimp)</SelectItem>
                          <SelectItem value="plant">Plant-based (fruits, grains)</SelectItem>
                          <SelectItem value="dairy">Dairy (milk, yogurt, eggs)</SelectItem>
                          <SelectItem value="mixed">Mixed (combination of categories)</SelectItem>
                          <SelectItem value="skipped">Skipped lunch</SelectItem>
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
                          <SelectItem value="meat">Meat-based (bacon, hotdogs, sausage)</SelectItem>
                          <SelectItem value="fish">Fish-based (salmon, tuna, shrimp)</SelectItem>
                          <SelectItem value="plant-based">Plant-based (fruits, grains)</SelectItem>
                          <SelectItem value="dairy">Dairy (milk, yogurt, eggs)</SelectItem>
                          <SelectItem value="mixed">Mixed (combination of categories)</SelectItem>
                          <SelectItem value="skipped">Skipped dinner</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={prevStep}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                
                {currentStep < 3 ? (
                  <Button type="button" className="transition-all duration-300 ease-out" onClick={nextStep}>Next Step</Button>
                ) : (
                  <Button
                    type="button"
                    className="flex items-center gap-2 transition-all duration-300 ease-out"
                    disabled={loadingStatus === 'loading'}
                    onClick={handleFormSubmit}
                  >
                    {loadingStatus === 'loading' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Calculate & Get AI Recommendations
                      </>
                    )}
                  </Button>
                )}
              </div>
            </form>

            {/* Show existing data cards only in form view */}
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
          </>
        ) : (
          // RESULTS VIEW - AI Recommendations interface
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center justify-center gap-2">
                <Lightbulb className="h-8 w-8 text-warning" />
                Your AI-Powered Recommendations
              </h1>
              <p className="text-muted-foreground">
                Personalized suggestions to reduce your carbon footprint
              </p>
            </div>

            {/* Edit Button */}
            <div className="flex justify-center">
              <Button 
                variant="outline" 
                onClick={handleEditFootprint}
                className="flex items-center gap-2 transition-all duration-300 ease-out"
              >
                <RotateCcw className="h-4 w-4" />
                Edit My Footprint
              </Button>
            </div>

            {/* Loading State */}
            {loadingStatus === 'loading' && (
              <Card className="shadow-card border-border">
                <CardContent className="p-8">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <div>
                      <h3 className="text-lg font-medium">Generating AI Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Analyzing your carbon footprint and creating personalized suggestions...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Error State */}
            {loadingStatus === 'error' && (
              <Card className="shadow-card border-border border-destructive">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Failed to Generate Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {errorMessage || 'We encountered an error while generating your personalized recommendations.'}
                  </p>
                  <div className="flex space-x-2">
                    <Button onClick={handleRetryRecommendations} size="sm" className="transition-all duration-300 ease-out">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button variant="outline" onClick={handleEditFootprint} size="sm">
                      Back to Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Success State - Show Recommendations */}
            {loadingStatus === 'success' && recommendations.length > 0 && (
              <RecommendationView 
                recommendations={recommendations}
                footprintData={footprintData}
                onRetry={handleRetryRecommendations}
              />
            )}

            {/* Empty State */}
            {loadingStatus === 'success' && recommendations.length === 0 && (
              <Card className="shadow-card border-border">
                <CardContent className="p-8 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Recommendations Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    We couldn't generate recommendations based on your current footprint data.
                  </p>
                  <Button onClick={handleRetryRecommendations} className="transition-all duration-300 ease-out">
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrackCarbon;