import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Leaf,
  CheckCircle2,
  Car,
  Home,
  Utensils,
  Sparkles,
  TrendingDown,
  Lock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: "transport" | "home" | "food";
  savingsValue: number | "calculated";
  completed: boolean;
  completedAt?: string;
}

interface ChallengeData {
  date: string;
  challenges: Challenge[];
  completedCount: number;
  allCompleted: boolean;
  isRecalculated: boolean;
  hasCompletedTracking: boolean;
  trackingRequired: boolean;
}

interface RecalculationResult {
  recalculated: boolean;
  originalFootprint?: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
  newFootprint?: {
    transport: number;
    homeEnergy: number;
    food: number;
    total: number;
  };
  savings?: number;
  appliedChallenges?: number;
}

const EcoChallengeSection: React.FC = () => {
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTodaysChallenges();
  }, []);

  const fetchTodaysChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/challenges/today`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch challenges");
      }

      const result = await response.json();
      setChallengeData(result.data);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load today's challenges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateChallenges = async () => {
    try {
      setRegenerating(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/challenges/regenerate`,
        {
          method: "POST",
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to regenerate challenges");
      }

      const result = await response.json();
      setChallengeData(result.data);

      toast({
        title: "Challenges Regenerated",
        description:
          "Today's challenges have been refreshed with new selections.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error regenerating challenges:", error);
      toast({
        title: "Error",
        description: "Failed to regenerate challenges. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    try {
      setCompleting(challengeId);

      const response = await fetch(
        `${import.meta.env.VITE_API_URL.replace(/\/+$/, "")}/api/challenges/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ challengeId }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        if (result.message?.includes("daily tracking")) {
          toast({
            title: "Daily Tracking Required",
            description:
              "Please complete your daily carbon footprint tracking first before attempting eco-challenges.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(result.message || "Failed to complete challenge");
      }

      if (challengeData) {
        const updatedChallenges = challengeData.challenges.map((challenge) =>
          challenge.id === challengeId
            ? {
                ...challenge,
                completed: true,
                completedAt: new Date().toISOString(),
              }
            : challenge,
        );

        setChallengeData({
          ...challengeData,
          challenges: updatedChallenges,
          completedCount: result.data.completedCount,
          allCompleted: result.data.allCompleted,
        });
      }

      const recalc = result.data.recalculation as RecalculationResult;
      let description = result.data.message;

      if (recalc?.recalculated && recalc.savings && recalc.savings > 0) {
        description += ` You saved ${recalc.savings.toFixed(2)} kg CO₂e!`;
      }

      toast({
        title: "Challenge Completed!",
        description,
        variant: "default",
        duration: 500,
      });

      if (result.data.allCompleted) {
        setTimeout(() => {
          toast({
            title: "Perfect Day!",
            description:
              "You've completed all three eco-challenges today! You're making a real difference!",
            variant: "default",
            duration: 1000,
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to complete challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCompleting(null);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "transport":
        return <Car className="h-5 w-5" />;
      case "home":
        return <Home className="h-5 w-5" />;
      case "food":
        return <Utensils className="h-5 w-5" />;
      default:
        return <Leaf className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "transport":
        return "bg-blue-500";
      case "home":
        return "bg-green-500";
      case "food":
        return "bg-orange-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatSavingsValue = (value: number | "calculated") => {
    if (value === "calculated") {
      return "Calculated savings";
    }
    return `${value} kg CO₂e`;
  };

  if (loading) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-card">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">
              Loading today's challenges...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challengeData) {
    return (
      <Card className="mb-8 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-card">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <Leaf className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No challenges available today. Please try again later.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (challengeData.trackingRequired) {
    return (
      <div className="mb-8">
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <span>Today's Eco-Challenges</span>
              </div>
              <Badge variant="secondary">
                {challengeData.completedCount}/3 completed
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>

        <Alert className="mb-6 border-warning bg-warning/10">
          <Lock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>Daily Tracking Required:</strong> Complete your daily
              carbon footprint tracking first to unlock eco-challenges!
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/track")}
              className="ml-4 transition-all duration-300 ease-out"
            >
              Track Now
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {challengeData.challenges.map((challenge) => (
            <Card
              key={challenge.id}
              className="shadow-card border-border opacity-60"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge
                    variant="secondary"
                    className={`${getCategoryColor(challenge.category)} text-white opacity-60`}
                  >
                    Daily Challenge
                  </Badge>
                  <Lock className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-lg flex items-center space-x-2">
                  {getCategoryIcon(challenge.category)}
                  <span>{challenge.title}</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {challenge.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Save: {formatSavingsValue(challenge.savingsValue)}
                  </span>
                  <div className="flex items-center space-x-1">
                    {getCategoryIcon(challenge.category)}
                    <span className="capitalize">{challenge.category}</span>
                  </div>
                </div>

                <Button disabled={true} className="w-full opacity-50">
                  <Lock className="mr-2 h-4 w-4" />
                  Complete Daily Tracking First
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-6 shadow-card border-border">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-3" />
              <h3 className="text-lg font-semibold mb-2">
                Unlock Your Eco-Challenges
              </h3>
              <p className="text-muted-foreground mb-4">
                Track your daily carbon footprint to unlock today's personalized
                eco-challenges and start making a difference!
              </p>
              <Button
                onClick={() => navigate("/track")}
                className="bg-primary hover:bg-primary/90 transition-all duration-300 ease-out"
                size="lg"
              >
                Start Daily Tracking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <Card className="mb-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20 shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span>Today's Eco-Challenges</span>
            </div>
            <Badge
              variant={challengeData.allCompleted ? "default" : "secondary"}
              className={challengeData.allCompleted ? "bg-green-500" : ""}
            >
              {challengeData.completedCount}/3 completed
            </Badge>
          </CardTitle>
          {challengeData.isRecalculated && (
            <div className="flex items-center space-x-2 text-sm text-success">
              <TrendingDown className="h-4 w-4" />
              <span>
                Your carbon footprint has been updated with challenge savings!
              </span>
            </div>
          )}
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {challengeData.challenges.map((challenge) => (
          <Card
            key={challenge.id}
            className={`shadow-card border transition-all duration-200 ${
              challenge.completed
                ? "border-green-300 bg-green-50/50"
                : "border-border hover:shadow-lg"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <Badge
                  variant="secondary"
                  className={`${getCategoryColor(challenge.category)} text-white`}
                >
                  Daily Challenge
                </Badge>
                {challenge.completed && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              <CardTitle className="text-lg flex items-center space-x-2">
                {getCategoryIcon(challenge.category)}
                <span>{challenge.title}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {challenge.description}
              </p>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Save: {formatSavingsValue(challenge.savingsValue)}</span>
                <div className="flex items-center space-x-1">
                  {getCategoryIcon(challenge.category)}
                  <span className="capitalize">{challenge.category}</span>
                </div>
              </div>

              {challenge.completed ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-green-600 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completed!</span>
                  </div>
                  {challenge.completedAt && (
                    <p className="text-xs text-muted-foreground">
                      Completed at{" "}
                      {new Date(challenge.completedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  onClick={() => completeChallenge(challenge.id)}
                  disabled={completing === challenge.id}
                  className="w-full"
                >
                  {completing === challenge.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    "I Did It!"
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6 shadow-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-1">
                {[1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full ${
                      step <= challengeData.completedCount
                        ? "bg-green-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {challengeData.completedCount} of 3 challenges completed today
              </span>
            </div>

            {challengeData.allCompleted && (
              <Badge className="bg-green-500 text-white">Perfect Day!</Badge>
            )}
          </div>

          {challengeData.allCompleted && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Congratulations!</strong> You've completed all three
                eco-challenges today. Your actions are making a real difference
                for the planet!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EcoChallengeSection;
