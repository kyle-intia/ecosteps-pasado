import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Car, Zap, Utensils, ArrowRight, ArrowLeft } from "lucide-react";
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
];

export default function PreAssessment() {
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
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
        const response = await fetch("http://localhost:4004/api/preassessment/user/status", {
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

  const canProceed = () => {
    const questionId = getCurrentQuestion().id;
    const question = getCurrentQuestion();
    
    // Basic UI validation - only check if input is provided
    // Server-side validation will handle detailed validation
    if (question.type === "checkbox") {
      const currentAnswers = answers[questionId];
      return currentAnswers && Array.isArray(currentAnswers) && currentAnswers.length > 0;
    }
    
    return answers[questionId] !== undefined && answers[questionId] !== null;
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
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
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
    })()
  };
};

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const responses = transformAnswersForBackend(answers);
      
      const response = await fetch("http://localhost:4004/api/preassessment/submit", {
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
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const section = getCurrentSection();
  const question = getCurrentQuestion();
  const Icon = section.icon;

  if (isPending) {
    return <Spinner />;
  }
  

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <div className="bg-card shadow-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-primary rounded-lg">
              <img
                src="/favicon.ico"
                alt="EcoStep Logo"
                className="h- w-6"
              />
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
                {question.options?.map((option) => (
                  <div key={option.value} className="flex items-center space-x-3">
                    <Checkbox
                      id={option.value}
                      checked={answers[question.id]?.includes?.(option.value) || false}
                      onCheckedChange={(checked) => {
                        const currentValues = answers[question.id] || [];
                        if (checked) {
                          handleAnswer([...currentValues, option.value]);
                        } else {
                          handleAnswer(currentValues.filter((v: string) => v !== option.value));
                        }
                      }}
                    />
                    <Label 
                      htmlFor={option.value} 
                      className="flex-1 cursor-pointer p-3 rounded-lg border border-border hover:bg-muted transition-smooth"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}

            {question.type === "slider" && (
              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-foreground">
                    {answers[question.id] || question.min}
                  </span>
                  <span className="text-muted-foreground ml-2">{question.unit}</span>
                </div>
                <Slider
                  value={[answers[question.id] || question.min]}
                  onValueChange={(value) => handleAnswer(value[0])}
                  max={question.max}
                  min={question.min}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{question.min} {question.unit}</span>
                  <span>{question.max}+ {question.unit}</span>
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
                {currentSection === questions.length - 1 && currentQuestion === getCurrentSection().questions.length - 1 ? (
                  isLoading ? "Calculating..." : "Complete Assessment"
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
