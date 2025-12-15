import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Car, Zap, Utensils, User, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import useSessionStatus from "../hooks/useSessionStatus";
import useAuth from "../hooks/useAuth";

const questions = [
  {
    id: "transportation",
    title: "Transportation",
    icon: Car,
    questions: [
      {
        id: "commute_method",
        question: "What is your primary mode of transportation for daily commute?",
        type: "radio",
        options: [
          { value: "car_alone", label: "Personal car" },
          { value: "motorcycle", label: "Motorcycle" },
          { value: "public_transport", label: "Public transportation (e.g. jeepney, tricycle, beep)" },
          { value: "bike_walk", label: "Bike/Walking" },
          { value: "remote", label: "Work from home" },
        ],
      },
      {
        id: "commute_distance",
        question: "How many kilometers do you travel daily for commute?",
        type: "slider",
        min: 0,
        max: 100,
        unit: "km",
      },
      {
        id: "flights_year",
        question: "How many flights do you take per year?",
        type: "slider",
        min: 0,
        max: 20,
        unit: "flights",
      },
    ],
  },
  {
    id: "energy",
    title: "Home Energy",
    icon: Zap,
    questions: [
      {
        id: "home_type",
        question: "What type of home do you live in?",
        type: "radio",
        options: [
          { value: "house_large", label: "Large House (3 or more bedrooms)" },
          { value: "house_small", label: "Small House (2 or less bedrooms)" },
          { value: "apartment", label: "Apartment/Condo" },
        ],
      },
      {
        id: "house_size",
        question: "How many people, including yourself, live in your home?",
        type: "slider",
        min: 0,
        max: 20,
        unit: "people",
      },
      {
        id: "electricity_bill",
        question: "What's your monthly electricity bill? (PHP)",
        type: "radio",
        options: [
          { value: "more_expensive_bill", label: "Above ₱25,000 / month" },
          { value: "expensive_bill", label: "₱12,001 – ₱25,000 / month" },
          { value: "less_expensive_bill", label: "₱7,501 – ₱12,000 / month" },
          { value: "cheap_bill", label: "Below ₱7,500 / month" },
        ],
      },
      {
        id: "renewable_energy",
        question: "Do you use renewable energy sources?",
        type: "radio",
        options: [
          { value: "fully", label: "Yes" },
          { value: "none", label: "No" },
        ],
      },
    ],
  },
  {
    id: "food",
    title: "Food & Diet",
    icon: Utensils,
    questions: [
      {
        id: "diet_type",
        question: "Which best describes your food diet?",
        type: "radio",
        options: [
          { value: "high_meat", label: "High meat intake (more than 3 times a week)" },
          { value: "medium_meat", label: "Moderate meat intake (2–3 times a week)" },
          { value: "low_meat", label: "Low meat intake (about once a week)" },
          { value: "pescetarian", label: "Pescetarian (fish but no meat)" },
          { value: "vegetarian", label: "Vegetarian or Vegan (no meat or fish)" },
        ],
      },
    ],
  },
  {
    id: "personal_context",
    title: "Personal Context",
    icon: User,
    questions: [
      {
        id: "travel_context",
        question: "Which of these best describes your primary daily travel context?",
        type: "radio",
        options: [
          { value: "commute_fixed", label: "I commute to a fixed workplace. (e.g., Office Worker, Teacher, Nurse)" },
          { value: "professional_driver", label: "I am a professional driver for my job. (e.g., Bus, Jeepney, Taxi, Grab Driver)" },
          { value: "delivery_rider", label: "I use a vehicle as part of my job. (e.g., Food/Grocery Delivery Rider)" },
          { value: "remote_work", label: "I work remotely or from home." },
          { value: "student", label: "I am a student." },
          { value: "other_context", label: "None of the above / My situation is different." },
        ],
      },
      {
        id: "mobility_considerations",
        question: "Do you have any mobility considerations or health conditions we should be aware of?",
        type: "checkbox",
        options: [
          { value: "respiratory", label: 'Respiratory condition (e.g., asthma / "hika")' },
          { value: "wheelchair", label: "Uses a wheelchair / mobility scooter" },
          { value: "walking_difficulty", label: "Has difficulty walking long distances" },
          { value: "heart_condition", label: "Heart condition" },
          { value: "visual_impairment", label: "Visual impairment" },
          { value: "none_mobility", label: "None of the above" },
        ],
        hasTextField: true,
        textFieldLabel: "Please share any other relevant details:",
      },
    ],
  },
];

export default function PreAssessment() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPending } = useSessionStatus();
  const { user } = useAuth();

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      // Only check assessment status if user is authenticated
      if (!user) {
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/preassessment/user/status`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await response.json();

        if (response.ok && data?.assessmentDone) {
          navigate("/home", { replace: true });
        }
      } catch (error) {
        console.error("Error checking assessment status:", error);
      }
    };

    checkAssessmentStatus();
  }, [navigate, user]);

  const getCurrentSection = () => questions[currentSection];
  const getCurrentQuestion = () => getCurrentSection().questions[currentQuestion];

  const handleAnswer = (value: any) => {
    const questionId = getCurrentQuestion().id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleTextFieldChange = (value: string) => {
    const questionId = getCurrentQuestion().id;
    const textFieldKey = `${questionId}_details`;
    setAnswers(prev => ({ ...prev, [textFieldKey]: value }));
  };

  const canProceed = () => {
    const questionId = getCurrentQuestion().id;
    const question = getCurrentQuestion();

    // Basic UI validation - only check if input is provided
    // Server-side validation will handle detailed validation
    if (question.type === "checkbox") {
      const currentAnswers = answers[questionId];
      return currentAnswers && Array.isArray(currentAnswers) && currentAnswers.length > 0;
    }

    const hasAnswer = answers[questionId] !== undefined && answers[questionId] !== null;

    return hasAnswer;
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const section = getCurrentSection();
    if (currentQuestion < section.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentSection < questions.length - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestion(0);
    } else {
      // This is the last question - show terms and conditions screen
      setShowTerms(true);
    }
  };

  const handlePrevious = () => {
    if (showTerms) {
      // If we're on the terms screen, go back to the last question
      setShowTerms(false);
    } else if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      setCurrentQuestion(questions[currentSection - 1].questions.length - 1);
    }
  };

  const transformAnswersForBackend = (frontendAnswers: Record<string, any>) => {
    // This function maps the frontend's answer format to the exact format expected by the backend API.
    return {
      // ✅ FIXED: Send a single primary mode, not an array.
      Q1_primaryMode: (() => {
        const mapping: Record<string, string> = {
          car_alone: "Personal Car",
          motorcycle: "Motorcycle",
          public_transport: "Public Transport", 
          bike_walk: "Bicycle/E-bike", // Matches backend enum
          remote: "Work from Home"
        };
        return mapping[frontendAnswers.commute_method] || "Personal Car";
      })(),

      Q2_kmPerDay: frontendAnswers.commute_distance || 0,
      Q3_flightsPerYear: frontendAnswers.flights_year || 0,

      Q4_homeType: (() => {
        const mapping: Record<string, string> = {
          house_large: "Large House",
          house_small: "Small House",
          apartment: "Apartment" // Matches backend enum
        };
        return mapping[frontendAnswers.home_type] || "Apartment";
      })(),

      Q5_residents: frontendAnswers.house_size || 1,

      // ✅ FIXED: Use the FULL descriptive string that matches the backend's 'enum'
      Q6_billRange: (() => {
        const mapping: Record<string, string> = {
          cheap_bill: "Below ₱7,500 / month", // Must match backend enum exactly
          less_expensive_bill: "₱7,501 – ₱12,000 / month",
          expensive_bill: "₱12,001 – ₱25,000 / month",
          more_expensive_bill: "Above ₱25,000 / month"
        };
        return mapping[frontendAnswers.electricity_bill] || "Below ₱7,500 / month";
      })(),

      Q7_hasRenewables: frontendAnswers.renewable_energy === "fully",

      // ✅ FIXED: Use the FULL descriptive string that matches the backend's 'enum' and CO2_FACTORS key
      Q8_dietType: (() => {
        const mapping: Record<string, string> = {
          high_meat: "High meat intake (more than 3 times a week)",
          medium_meat: "Moderate meat intake (2–3 times a week)",
          low_meat: "Low meat intake (about once a week)",
          pescetarian: "Pescetarian (fish but no meat)", // Note: Spelling must match ('Pescetarian', not 'Pescatarian')
          vegetarian: "Vegetarian or Vegan (no meat or fish)"
        };
        return mapping[frontendAnswers.diet_type] || "Moderate meat intake (2–3 times a week)";
      })(),

      // NEW: Question 9 - Travel Context (for AI recommendations only)
      Q9_travelContext: (() => {
        const mapping: Record<string, string> = {
          commute_fixed: "commute_fixed",
          professional_driver: "professional_driver",
          delivery_rider: "delivery_rider",
          remote_work: "remote_work",
          non_standard_hours: "non_standard_hours",
          student: "student",
          other_context: "other_context"
        };
        return mapping[frontendAnswers.travel_context] || "other_context";
      })(),

      // NEW: Question 10 - Mobility Considerations (for AI recommendations only)
      Q10_mobilityConsiderations: frontendAnswers.mobility_considerations || [],
      Q10_mobilityDetails: frontendAnswers.mobility_considerations_details || ""
    };
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      toast({
        title: "Accept Terms Required",
        description: "Please accept the terms and conditions to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const responses = transformAnswersForBackend(answers);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api/preassessment/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          responses
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit assessment");
      }

      const annualFootprintKg = data.data.results.totalCO2;
      // Convert to tonnes per month
      const tonnesPerMonth = (annualFootprintKg / 1000) / 12; // First to tonnes per year, then to per month
      const displayValue = tonnesPerMonth.toFixed(2); // Round to 2 decimal places
      
      // Store minimal data in localStorage for immediate use
      localStorage.setItem("needsPreAssessment", "false");
      localStorage.setItem("initialFootprint", annualFootprintKg.toString());
      
      toast({
        title: "Assessment Complete!",
        description: `Your estimated carbon footprint is ${displayValue} tons CO₂ per month.`,
      });
      

      navigate("/userprofile");

      
    } catch (error) {
      console.error("Error submitting assessment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit assessment",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalQuestions = questions.reduce((total, section) => total + section.questions.length, 0);
  const currentQuestionNumber = questions.slice(0, currentSection).reduce((total, section) => total + section.questions.length, 0) + currentQuestion + 1;
  const progress = showTerms ? 100 : (currentQuestionNumber / totalQuestions) * 100;

  const section = getCurrentSection();
  const question = getCurrentQuestion();
  const Icon = section.icon;

  if (isPending) {
    return <Spinner />;
  }

  // Terms and Conditions Screen
  if (showTerms) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        {/* Header */}
        <div className="bg-card shadow-card border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Terms and Conditions</h1>
                <p className="text-muted-foreground">Please review and accept to complete your assessment</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Complete</span>
                <span>100% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `100%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Terms and Conditions Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="shadow-elevated border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Data Usage Agreement</CardTitle>
              <CardDescription>
                How we use your assessment data
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 bg-muted rounded-lg border border-border">
                <h3 className="text-lg font-semibold">Privacy & Data Usage</h3>
                <div className="text-sm text-muted-foreground space-y-3">
                  <p>
                    Your responses will be used to calculate your carbon footprint and provide personalized eco-friendly recommendations. 
                  </p>
                  <p>
                    We assure you that your data is kept private and secure, and will not be shared with third parties without your explicit consent.
                  </p>
                  <p>
                    The carbon footprint calculation is based on standard environmental impact factors and is intended for educational and awareness purposes.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <Label htmlFor="terms" className="text-sm">
                  I agree to the terms and conditions and understand how my data will be used
                </Label>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={!termsAccepted || isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Assessment"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Regular Question Screen
  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card shadow-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">EcoStep Pre-Assessment</h1>
              <p className="text-muted-foreground">Help us calculate your initial carbon footprint</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestionNumber} of {totalQuestions}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="shadow-elevated border-border">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-3 bg-gradient-primary rounded-xl">
                <Icon className="h-8 w-8 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">{section.title}</CardTitle>
                <CardDescription>{question.question}</CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {question.type === "radio" && (
              <RadioGroup
                value={answers[question.id] || ""}
                onValueChange={handleAnswer}
              >
                {question.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted transition-smooth"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {question.type === "checkbox" && (
              <div className="space-y-3">
                {question.options?.map((option) => {
                  const isNoneSelected = answers[question.id]?.includes?.("none_mobility");
                  const isDisabled = isNoneSelected && option.value !== "none_mobility";
                  return (
                    <div key={option.value} className="flex items-center space-x-3">
                      <Checkbox
                        id={option.value}
                        checked={answers[question.id]?.includes?.(option.value) || false}
                        disabled={isDisabled}
                        onCheckedChange={(checked) => {
                          const currentValues = answers[question.id] || [];
                          if (checked) {
                            if (option.value === "none_mobility") {
                              // Selecting "None of the above" clears all others
                              handleAnswer(["none_mobility"]);
                            } else {
                              // Selecting another option removes "None of the above" if selected
                              const newValues = currentValues.filter((v: string) => v !== "none_mobility");
                              handleAnswer([...newValues, option.value]);
                            }
                          } else {
                            // Unchecking removes the option
                            handleAnswer(currentValues.filter((v: string) => v !== option.value));
                          }
                        }}
                      />
                      <Label
                        htmlFor={option.value}
                        className={`flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted transition-smooth ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {option.label}
                      </Label>
                    </div>
                  );
                })}

                {/* Optional text field for additional details */}
                {(question as any).hasTextField && (
                  <div className="pt-4 space-y-2">
                    <Label htmlFor="additional_details" className="text-sm text-muted-foreground">
                      {(question as any).textFieldLabel}
                    </Label>
                    <Input
                      id="additional_details"
                      placeholder="Optional: Share any other relevant information..."
                      value={answers[`${question.id}_details`] || ""}
                      onChange={(e) => handleTextFieldChange(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            )}

            {question.type === "slider" && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">
                    {answers[question.id] || (question as any).min}
                  </span>
                  <span className="text-muted-foreground ml-2">{(question as any).unit}</span>
                </div>
                <Slider
                  value={[answers[question.id] || (question as any).min]}
                  onValueChange={(value) => handleAnswer(value[0])}
                  max={(question as any).max}
                  min={(question as any).min}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{(question as any).min} {(question as any).unit}</span>
+                 <span>{(question as any).max}+ {(question as any).unit}</span>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentSection === 0 && currentQuestion === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                variant="hero"
                onClick={handleNext}
                disabled={!canProceed() || isLoading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}