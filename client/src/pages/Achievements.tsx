import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Trophy,
  Lock,
  Star,
  CheckCircle,
  Plus,
  X,
  ArrowLeft,
} from "lucide-react";
import {
  getUserAchievements,
  equipAchievement,
  unequipAchievement,
} from "../lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Achievement {
  achievementId: string;
  name: string;
  description: string;
  category: string;
  tier: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  targetValue: number;
  profilePriority: number;
  isEquipped?: boolean;
}

interface AchievementResponse {
  achievements: Achievement[];
  equipped: { achievementId: string; equippedAt: string }[];
  stats: Record<string, any>;
}

interface EquippedAchievement {
  achievementId: string;
  equippedAt: string;
}

const categoryColors = {
  daily: "bg-blue-500/10 text-blue-700 border-blue-200",
  challenge: "bg-purple-500/10 text-purple-700 border-purple-200",
  carbon: "bg-green-500/10 text-green-700 border-green-200",
  transport: "bg-orange-500/10 text-orange-700 border-orange-200",
  home: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  food: "bg-red-500/10 text-red-700 border-red-200",
};

const tierColors = {
  bronze: "text-amber-600",
  silver: "text-gray-600",
  gold: "text-yellow-500",
  platinum: "text-purple-600",
};

const Achievements = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: achievementData,
    isLoading,
    error,
  } = useQuery<AchievementResponse, Error>({
    queryKey: ["achievements"],
    queryFn: getUserAchievements,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const {
    achievements = [],
    equipped = [],
    stats = {},
  } = achievementData || {};

  const achievementsWithEquipped = useMemo(
    () =>
      achievements.map((a) => ({
        ...a,
        isEquipped: equipped.some((e) => e.achievementId === a.achievementId),
      })),
    [achievements, equipped],
  );

  const categories = ["All", ...new Set(achievements.map((a) => a.category))];

  const filteredAchievements = useMemo(
    () =>
      achievementsWithEquipped.filter((achievement) => {
        const matchesSearch =
          achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          achievement.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesCategory =
          selectedCategory === "All" ||
          achievement.category === selectedCategory;
        return matchesSearch && matchesCategory;
      }),
    [achievementsWithEquipped, searchQuery, selectedCategory],
  );

  const equipMutation = useMutation({
    mutationFn: (achievementId: string) => equipAchievement(achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({
        title: "Achievement Equipped!",
        description: "This achievement is now displayed on your profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to equip achievement",
        variant: "destructive",
      });
    },
  });

  const unequipMutation = useMutation({
    mutationFn: (achievementId: string) => unequipAchievement(achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      toast({
        title: "Achievement Unequipped",
        description: "This achievement is no longer displayed on your profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unequip achievement",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const handleAchievementUnlock = (event: any) => {
      const { achievement } = event.detail as { achievement: Achievement };
      toast({
        title: "🎉 Achievement Unlocked!",
        description: `You earned "${achievement.name}"!`,
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    };

    window.addEventListener("achievement-unlocked", handleAchievementUnlock);
    return () => {
      window.removeEventListener(
        "achievement-unlocked",
        handleAchievementUnlock,
      );
    };
  }, [toast, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Error Loading Achievements
          </h2>
          <p className="text-muted-foreground">Please try again later.</p>
        </div>
      </div>
    );
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalPoints = achievements.filter((a) => a.unlocked).length * 100; // Mock points calculation
  const challengeStats = stats.totalChallengesCompleted || 0;

  const handleEquipToggle = (achievement: Achievement) => {
    if (achievement.isEquipped) {
      unequipMutation.mutate(achievement.achievementId);
    } else {
      if (equipped.length >= 3) {
        toast({
          title: "Maximum Equipped",
          description:
            "You can only equip 3 achievements at a time. Unequip one first.",
          variant: "destructive",
        });
        return;
      }
      equipMutation.mutate(achievement.achievementId);
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    if (achievement.unlocked) return 100;
    return Math.min(
      100,
      (achievement.progress / achievement.targetValue) * 100,
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-3">
            <Trophy className="h-10 w-10 text-yellow-500" />
            Achievements
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Earn achievements by taking eco-friendly actions and making a
            positive impact
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">{unlockedCount}</p>
              <p className="text-sm text-muted-foreground">Unlocked</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {achievements.length}
              </p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-success">{totalPoints}</p>
              <p className="text-sm text-muted-foreground">Points Earned</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                {equipped.length}/3
              </p>
              <p className="text-sm text-muted-foreground">Equipped</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search achievements..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize transition-all duration-300 ease-out"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAchievements.map((achievement) => {
            const categoryColor = categoryColors[achievement.category];
            const tierColor = tierColors[achievement.tier];
            const progressPercentage = getProgressPercentage(achievement);

            return (
              <Card
                key={achievement.achievementId}
                className={`relative hover:shadow-lg transition-all duration-200 ${
                  achievement.unlocked
                    ? "border-primary/20 bg-gradient-to-br from-background to-primary/5"
                    : "border-muted opacity-75"
                } ${achievement.isEquipped ? "ring-2 ring-primary/50" : ""}`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-3 rounded-lg ${achievement.unlocked ? "bg-primary/10" : "bg-muted"} relative`}
                      >
                        {achievement.unlocked ? (
                          <>
                            <span className="text-2xl">{achievement.icon}</span>
                            {achievement.isEquipped && (
                              <Star className="h-3 w-3 text-yellow-500 absolute -top-1 -right-1 fill-current" />
                            )}
                          </>
                        ) : (
                          <Lock className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle
                          className={`text-lg flex items-center gap-2 ${achievement.unlocked ? "w-[130px]" : ""}`}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate">
                                {achievement.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {achievement.name}
                            </TooltipContent>
                          </Tooltip>
                          <span className={`text-sm ${tierColor}`}>
                            {achievement.tier === "bronze" && "🥉"}
                            {achievement.tier === "silver" && "🥈"}
                            {achievement.tier === "gold" && "🥇"}
                            {achievement.tier === "platinum" && "💎"}
                          </span>
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`mt-1 ${categoryColor} text-xs`}
                        >
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {achievement.unlocked && (
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      )}

                      {achievement.unlocked && (
                        <Button
                          size="sm"
                          variant={
                            achievement.isEquipped ? "default" : "outline"
                          }
                          onClick={() => handleEquipToggle(achievement)}
                          disabled={
                            equipMutation.isPending || unequipMutation.isPending
                          }
                          className="text-xs transition-all duration-300 ease-out"
                        >
                          {achievement.isEquipped ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Equipped
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              Equip
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-muted-foreground mb-4 text-sm">
                    {achievement.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.targetValue}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          achievement.unlocked
                            ? "bg-gradient-to-r from-green-500 to-green-600"
                            : "bg-gradient-to-r from-primary/70 to-primary"
                        }`}
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-medium">
                        {achievement.targetValue}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Priority:</span>
                      <span className="font-medium">
                        {achievement.profilePriority}/10
                      </span>
                    </div>

                    {achievement.unlocked && achievement.unlockedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Earned:</span>
                        <span className="font-medium text-success">
                          {formatDate(achievement.unlockedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAchievements.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No achievements found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}

        {/* Equipped Achievements Summary */}
        {equipped.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Achievements ({equipped.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {equipped.map((equippedItem) => {
                  const achievement = achievements.find(
                    (a) => a.achievementId === equippedItem.achievementId,
                  );
                  if (!achievement) return null;

                  return (
                    <div
                      key={equippedItem.achievementId}
                      className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg"
                    >
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <span className="text-2xl">{achievement.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {achievement.name}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-success font-medium">
                          Equipped {formatDate(equippedItem.equippedAt)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEquipToggle(achievement)}
                        className="h-8 w-8 p-0 transition-all duration-300 ease-out"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-0 left-0 right-0 backdrop-blur-sm border-t border-[hsl(240,6%,90%)] p-4 shadow-lg z-50">
          <div className="container mx-auto max-w-7xl">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto group border-[hsl(240,6%,90%)] text-[hsl(240,10%,10%)] hover:bg-[hsl(240,5%,96%)]"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Go Back
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Achievements;
