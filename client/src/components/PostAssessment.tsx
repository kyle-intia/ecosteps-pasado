import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Leaf, ChevronRight, Sparkles } from "lucide-react";

type Question = {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    co2Impact: number;
    tip: string;
  }[];
};

const questions: Question[] = [
  {
    id: "transport",
    question: "What is your primary mode of transportation for daily commute?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public_transport",
        label: "Public transportation (e.g. jeepney, tricycle, beep)",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike_walk",
        label: "Bike/Walking",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "remote",
        label: "Work from home",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
  {
    id: "transport",
    question: "How do you usually get around on a typical day?",
    options: [
      {
        value: "car",
        label: "Drive alone in a car",
        co2Impact: 4000,
        tip: "Carpooling or public transport can cut this by up to 70%!",
      },
      {
        value: "public",
        label: "Bus, train, or subway",
        co2Impact: 800,
        tip: "Great choice! Public transport is much greener.",
      },
      {
        value: "bike",
        label: "Bike or walk",
        co2Impact: 0,
        tip: "Zero emissions — you're a sustainability superstar! 🚴",
      },
      {
        value: "ev",
        label: "Electric vehicle",
        co2Impact: 1200,
        tip: "Much better than petrol — keep charging with renewables!",
      },
    ],
  },
];

interface FirstTimeAwarenessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (
    answers: Record<string, string>,
    estimatedFootprint: number,
  ) => void;
}

export function FirstTimeAwarenessDialog({
  open,
  onOpenChange,
  onComplete,
}: FirstTimeAwarenessDialogProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[step];

  const progress =
    ((step + (answers[currentQuestion?.id] ? 1 : 0)) / questions.length) * 100;

  const handleNext = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      const estimatedFootprint = Object.keys(answers).reduce((total, key) => {
        const option = questions
          .flatMap((q) => q.options)
          .find((o) => o.value === answers[key]);
        return total + (option?.co2Impact || 0);
      }, 0);

      setIsSubmitting(true);
      onComplete(answers, Math.round(estimatedFootprint / 1000)); // CO2 in tonnes
    }
  };

  const handleSelect = (value: string) => {
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const getResultMessage = () => {
    const total = Object.keys(answers).reduce((sum, key) => {
      const opt = questions
        .flatMap((q) => q.options)
        .find((o) => o.value === answers[key]);
      return sum + (opt?.co2Impact || 0);
    }, 0);

    const tonnes = Math.round(total / 1000);

    if (tonnes < 4)
      return "Wow! You're already living very lightly on the planet 🌍";
    if (tonnes < 7) return "You're doing better than most — keep improving! 🌱";
    return "There's great potential to reduce your impact — we're here to help! 💚";
  };

  const getSelectedTip = () => {
    const selectedValue = answers[currentQuestion.id];
    const option = currentQuestion.options.find(
      (o) => o.value === selectedValue,
    );
    return option?.tip || "";
  };

  useEffect(() => {
    if (open) {
      setStep(0);
      setAnswers({});
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">
            {step < questions.length
              ? "Monthly Post Assesment"
              : "Your Eco Profile"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {step < questions.length
              ? `Question ${step + 1} of ${questions.length}.`
              : "Let's get you started on your journey!"}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6">
          <Progress value={progress} className="h-2" />
        </div>

        {step < questions.length ? (
          <>
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-center">
                {currentQuestion.question}
              </h3>

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={handleSelect}
                className="space-y-3"
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 rounded-lg border p-4 transition-all hover:bg-accent/50 cursor-pointer"
                    onClick={() => handleSelect(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label
                      htmlFor={option.value}
                      className="cursor-pointer flex-1 font-medium"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {answers[currentQuestion.id] && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg text-sm flex items-start gap-2">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <p className="text-primary font-medium">{getSelectedTip()}</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleNext}
              disabled={!answers[currentQuestion.id]}
              className="w-full mt-8"
            >
              {step === questions.length - 1 ? "See My Impact" : "Next"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </>
        ) : (
          // Final Step: Result + Setup
          <div className="space-y-6 text-center">
            <div className="py-6">
              <div className="text-5xl font-bold text-primary mb-2">
                ~
                {Math.round(
                  Object.keys(answers).reduce((sum, key) => {
                    const opt = questions
                      .flatMap((q) => q.options)
                      .find((o) => o.value === answers[key]);
                    return sum + (opt?.co2Impact || 0);
                  }, 0) / 1000,
                )}{" "}
                tonnes
              </div>
              <p className="text-lg text-muted-foreground">
                CO₂ per year (estimated)
              </p>
              <p className="mt-4 text-lg font-medium">{getResultMessage()}</p>
            </div>

            <Button
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-full mt-8"
            >
              {isSubmitting ? "Saving..." : "Done"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
