import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Leaf, AlertCircle, CheckCircle2 } from "lucide-react";
import { useDashboardData } from "../hooks/useDashboard";

const AWARENESS_QUESTIONS = [
  "1.) I understand how my daily activities contribute to carbon emissions",
  "2.) I am aware of the environmental impact of my transportation choices",
  "3.) I know how my food choices affect the environment",
  "4.) I am aware that household electricity usage contributes to emissions.",
  "5.) I understand the importance of reducing my carbon footprint",
];

const BEHAVIOR_QUESTIONS = [
  "1.) I turn off lights and appliances when not in use.",
  "2.) I use energy-efficient appliances or LED lighting.",
  "3.) I choose public transport, walking, or biking when possible.",
  "4.) I limit air travel unless necessary.",
  "5.) I reduce meat consumption for environmental reasons.",
  "6.) I avoid wasting food.",
  "7.) I use reusable bags or containers.",
  "8.) I consider environmental impact in daily decisions.",
];

interface AssessmentDialogProps {
  userId: string;
  assessmentType: "pre" | "post";
  isOpen: boolean;
  onComplete: () => void;
}

export const AssessmentDialog: React.FC<AssessmentDialogProps> = ({
  userId,
  assessmentType,
  isOpen,
  onComplete,
}) => {
  const [step, setStep] = useState(1);
  const [awarenessAnswers, setAwarenessAnswers] = useState<number[]>([]);
  const [behaviorAnswers, setBehaviorAnswers] = useState<number[]>([]);
  const [monthlyEmissions, setMonthlyEmissions] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const { data: dashboardData } = useDashboardData();

  const { metrics } = dashboardData?.data || {};

  const baselineAnnual = metrics?.baselineAnnual || 0;
  const currentEmissions = metrics?.currentEmissions || 0;

  const totalSteps = 3;
  const isPre = assessmentType === "pre";

  useEffect(() => {
    const baselineMonthly = (baselineAnnual / 12).toFixed(2);
    const currentMonthly = (currentEmissions * 1000).toFixed(2);
    setMonthlyEmissions(isPre ? baselineMonthly : currentMonthly);
  }, [baselineAnnual, currentEmissions, isPre]);

  const handleLikertAnswer = (
    questionIndex: number,
    value: number,
    type: "awareness" | "behavior",
  ) => {
    if (type === "awareness") {
      const newAnswers = [...awarenessAnswers];
      newAnswers[questionIndex] = value;
      setAwarenessAnswers(newAnswers);
    } else {
      const newAnswers = [...behaviorAnswers];
      newAnswers[questionIndex] = value;
      setBehaviorAnswers(newAnswers);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return (
        awarenessAnswers.length === AWARENESS_QUESTIONS.length &&
        awarenessAnswers.every((a) => a >= 1 && a <= 5)
      );
    }
    if (step === 2) {
      return (
        behaviorAnswers.length === BEHAVIOR_QUESTIONS.length &&
        behaviorAnswers.every((a) => a >= 1 && a <= 5)
      );
    }
    if (step === 3) {
      return (
        !isNaN(parseFloat(monthlyEmissions)) && parseFloat(monthlyEmissions) > 0
      );
    }
    return false;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/assessments`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            type: assessmentType,
            awarenessAnswers,
            behaviorAnswers,
            monthlyEmissions: parseFloat(monthlyEmissions),
          }),
        },
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to save assessment");
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const LikertScale = ({
    question,
    questionIndex,
    type,
    currentValue,
  }: {
    question: string;
    questionIndex: number;
    type: "awareness" | "behavior";
    currentValue?: number;
  }) => (
    <div className="mb-6">
      <p className="text-md font-medium mb-3">{question}</p>
      <div className="flex gap-2 justify-between">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            onClick={() => handleLikertAnswer(questionIndex, value, type)}
            className={`flex-1 py-2 px-1 rounded-lg border-2 transition-all ${
              currentValue === value
                ? "border-green-600 bg-green-50 text-green-900"
                : "border-gray-200 hover:border-green-300 bg-white"
            }`}
          >
            <div className="text-xs font-bold mt-1">
              {value === 1 && "Strongly Disagree"}
              {value === 2 && "Slightly Disagree"}
              {value === 3 && "Neutral"}
              {value === 4 && "Slightly Agree"}
              {value === 5 && "Strongly Agree"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-eco text-eco-foreground p-2 rounded-lg shrink-0">
              <img src="/favicon.ico" alt="EcoStep Logo" className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl">
              {isPre ? "Welcome! Initial Assessment" : "Monthly Assessment"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {isPre
              ? "Help us understand your current environmental awareness and behaviors."
              : "Let's see how you've progressed this month!"}
          </DialogDescription>
        </DialogHeader>

        <div>
          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                Step {step} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((step / totalSteps) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <Alert className="mb-4 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Awareness Questions */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Environmental Awareness
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Rate your agreement with each statement (1 = Strongly Disagree,
                5 = Strongly Agree)
              </p>
              {AWARENESS_QUESTIONS.map((question, index) => (
                <LikertScale
                  key={index}
                  question={question}
                  questionIndex={index}
                  type="awareness"
                  currentValue={awarenessAnswers[index]}
                />
              ))}
            </div>
          )}

          {/* Step 2: Behavior Questions */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Environmental Behaviors
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Rate your agreement with each statement (1 = Strongly Disagree,
                5 = Strongly Agree)
              </p>
              {BEHAVIOR_QUESTIONS.map((question, index) => (
                <LikertScale
                  key={index}
                  question={question}
                  questionIndex={index}
                  type="behavior"
                  currentValue={behaviorAnswers[index]}
                />
              ))}
            </div>
          )}

          {/* Step 3: Emissions Estimate */}
          {step === 3 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Monthly Emissions Estimate
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                {isPre
                  ? "Based on your pre-assessment earlier, your estimated monthly carbon emissions are "
                  : "Based on your progress, your current estimated monthly carbon emissions are "}
                <strong>{monthlyEmissions} kg CO₂</strong>.
              </p>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Monthly Emissions (kg CO₂)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={monthlyEmissions}
                  onChange={(e) => setMonthlyEmissions(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none"
                  disabled
                />
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Back
              </Button>
            )}
            {step < totalSteps ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Continue
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? "Submitting..." : "Complete Assessment"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to manage assessment state
export const useAssessmentDialog = (userId: string) => {
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentType, setAssessmentType] = useState<"pre" | "post">("pre");
  const [isLoading, setIsLoading] = useState(true);

  const isEndOfMonth = (date = new Date()) => {
    const tomorrow = new Date(date);
    tomorrow.setDate(date.getDate() + 1);
    return tomorrow.getDate() === 1;
  };

  useEffect(() => {
    const checkAssessmentStatus = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/assessments/user/${userId}`,
          {
            credentials: "include",
          },
        );

        if (!response.ok) throw new Error("Failed to fetch assessments");

        const data = await response.json();
        const assessments = data.assessments || [];

        const hasPreAssessment = assessments.some((a: any) => a.type === "pre");

        if (!hasPreAssessment) {
          setAssessmentType("pre");
          setShowAssessment(true);
          setIsLoading(false);
          return;
        }

        const now = new Date();
        if (!isEndOfMonth(now)) {
          setShowAssessment(false);
          setIsLoading(false);
          return;
        }

        const hasPostThisMonth = assessments.some((a: any) => {
          if (a.type !== "post") return false;

          const d = new Date(a.createdAt);
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        });

        if (!hasPostThisMonth) {
          setAssessmentType("post");
          setShowAssessment(true);
        } else {
          setShowAssessment(false);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Assessment check failed:", err);
        setIsLoading(false);
      }
    };

    checkAssessmentStatus();
  }, [userId]);

  const handleComplete = () => {
    setShowAssessment(false);
  };

  return {
    showAssessment,
    assessmentType,
    handleComplete,
    isLoading,
  };
};

// Example usage component
export default function App() {
  const userId = "user123"; // Replace with actual user ID
  const { showAssessment, assessmentType, handleComplete, isLoading } =
    useAssessmentDialog(userId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">
          Environmental Impact Dashboard
        </h1>
        <p className="text-gray-600 mb-8">
          Track your carbon footprint and environmental progress
        </p>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Progress</h2>
          <p className="text-gray-600">
            Your assessment data will appear here after completion.
          </p>
        </div>

        <AssessmentDialog
          userId={userId}
          assessmentType={assessmentType}
          isOpen={showAssessment}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
