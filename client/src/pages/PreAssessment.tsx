import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Car, Zap, Utensils, ArrowRight, ArrowLeft } from "lucide-react";

const questions = [
  {
    id: "transportation",
    title: "Transportation",
    icon: Car,
    questions: [
      {
        id: "commute_method",
        question: "What's your primary mode of transportation for daily commute?",
        type: "radio",
        options: [
          { value: "car_alone", label: "Personal car (alone)", factor: 2.3 },
          { value: "carpool", label: "Carpool/rideshare", factor: 1.2 },
          { value: "public_transport", label: "Public transportation", factor: 0.6 },
          { value: "bike_walk", label: "Bike/Walking", factor: 0.1 },
          { value: "remote", label: "Work from home", factor: 0.0 },
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
          { value: "apartment", label: "Apartment", factor: 0.8 },
          { value: "townhouse", label: "Townhouse", factor: 1.0 },
          { value: "house_small", label: "Small house", factor: 1.2 },
          { value: "house_large", label: "Large house", factor: 1.8 },
        ],
      },
      {
        id: "electricity_bill",
        question: "What's your monthly electricity bill? (USD)",
        type: "slider",
        min: 0,
        max: 500,
        unit: "$",
      },
      {
        id: "renewable_energy",
        question: "Do you use renewable energy sources?",
        type: "radio",
        options: [
          { value: "none", label: "No renewable energy", factor: 1.0 },
          { value: "partial", label: "Partially renewable", factor: 0.6 },
          { value: "mostly", label: "Mostly renewable", factor: 0.3 },
          { value: "fully", label: "100% renewable", factor: 0.1 },
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
        question: "Which best describes your diet?",
        type: "radio",
        options: [
          { value: "high_meat", label: "High meat consumption", factor: 2.5 },
          { value: "medium_meat", label: "Moderate meat consumption", factor: 1.8 },
          { value: "low_meat", label: "Low meat consumption", factor: 1.2 },
          { value: "vegetarian", label: "Vegetarian", factor: 0.8 },
          { value: "vegan", label: "Vegan", factor: 0.5 },
        ],
      },
      {
        id: "local_food",
        question: "How often do you buy local/organic food?",
        type: "radio",
        options: [
          { value: "never", label: "Never", factor: 1.0 },
          { value: "rarely", label: "Rarely", factor: 0.9 },
          { value: "sometimes", label: "Sometimes", factor: 0.7 },
          { value: "often", label: "Often", factor: 0.5 },
          { value: "always", label: "Always", factor: 0.3 },
        ],
      },
      {
        id: "food_waste",
        question: "How much food do you typically waste? (%)",
        type: "slider",
        min: 0,
        max: 50,
        unit: "%",
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

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    if (!isLoggedIn) {
      navigate("/");
    }
  }, [navigate]);

  const getCurrentSection = () => questions[currentSection];
  const getCurrentQuestion = () => getCurrentSection().questions[currentQuestion];

  const handleAnswer = (value: any) => {
    const questionId = getCurrentQuestion().id;
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const canProceed = () => {
    const questionId = getCurrentQuestion().id;
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

  const calculateFootprint = () => {
    // Simple calculation based on answers
    let totalEmissions = 0;

    // Transportation
    const commuteMethod = answers.commute_method || "car_alone";
    const commuteDistance = answers.commute_distance || 20;
    const flights = answers.flights_year || 2;
    
    const methodFactor = questions[0].questions[0].options?.find(opt => opt.value === commuteMethod)?.factor || 2.3;
    totalEmissions += (methodFactor * commuteDistance * 22) / 1000; // Monthly emissions
    totalEmissions += flights * 0.5; // Flight emissions

    // Energy
    const homeType = answers.home_type || "apartment";
    const electricityBill = answers.electricity_bill || 100;
    const renewable = answers.renewable_energy || "none";

    const homeFactor = questions[1].questions[0].options?.find(opt => opt.value === homeType)?.factor || 1.0;
    const renewableFactor = questions[1].questions[2].options?.find(opt => opt.value === renewable)?.factor || 1.0;
    totalEmissions += (electricityBill * 0.005 * homeFactor * renewableFactor);

    // Food
    const dietType = answers.diet_type || "medium_meat";
    const localFood = answers.local_food || "sometimes";
    const foodWaste = answers.food_waste || 20;

    const dietFactor = questions[2].questions[0].options?.find(opt => opt.value === dietType)?.factor || 1.8;
    const localFactor = questions[2].questions[1].options?.find(opt => opt.value === localFood)?.factor || 0.7;
    totalEmissions += (dietFactor * localFactor * (1 + foodWaste / 100));

    return Math.round(totalEmissions * 100) / 100;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    const footprint = calculateFootprint();
    
    // Store assessment results
    setTimeout(() => {
      localStorage.setItem("needsPreAssessment", "false");
      localStorage.setItem("initialFootprint", footprint.toString());
      localStorage.setItem("assessmentAnswers", JSON.stringify(answers));
      
      toast({
        title: "Assessment Complete!",
        description: `Your estimated carbon footprint is ${footprint} tons CO₂ per month.`,
      });
      
      navigate("/dashboard");
      setIsLoading(false);
    }, 1500);
  };

  const totalQuestions = questions.reduce((total, section) => total + section.questions.length, 0);
  const currentQuestionNumber = questions.slice(0, currentSection).reduce((total, section) => total + section.questions.length, 0) + currentQuestion + 1;
  const progress = (currentQuestionNumber / totalQuestions) * 100;

  const section = getCurrentSection();
  const question = getCurrentQuestion();
  const Icon = section.icon;

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