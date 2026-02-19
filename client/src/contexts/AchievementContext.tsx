import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  getUserAchievements,
  equipAchievement as equipAchievementAPI,
  unequipAchievement as unequipAchievementAPI,
} from "@/lib/api";

interface AchievementData {
  achievements: any[];
  equipped: any[];
  stats: any;
}

const AchievementContext = createContext({});

export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error(
      "useAchievements must be used within an AchievementProvider",
    );
  }
  return context;
};

export const AchievementProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: achievementData,
    isLoading,
    error,
    refetch,
  } = useQuery<AchievementData>({
    queryKey: ["achievements"],
    queryFn: getUserAchievements,
    staleTime: 1000 * 60 * 5,
  });

  const equipMutation = useMutation({
    mutationFn: equipAchievementAPI,
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
    mutationFn: unequipAchievementAPI,
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
    const handleAchievementUnlock = (event) => {
      const { achievement } = event.detail;

      const newNotification = {
        id: Date.now(),
        type: "achievement_unlock",
        achievement,
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 9)]); // Keep last 10

      toast({
        title: "Achievement Unlocked!",
        description: `You earned "${achievement.name}"!`,
        duration: 5000,
      });

      refetch();
    };

    const handleChallengeComplete = (event) => {
      const { challenge, newAchievements } = event.detail;

      if (newAchievements && newAchievements.length > 0) {
        newAchievements.forEach((achievement) => {
          handleAchievementUnlock({ detail: { achievement } });
        });
      }
    };

    window.addEventListener("achievement-unlocked", handleAchievementUnlock);
    window.addEventListener("challenge-completed", handleChallengeComplete);

    return () => {
      window.removeEventListener(
        "achievement-unlocked",
        handleAchievementUnlock,
      );
      window.removeEventListener(
        "challenge-completed",
        handleChallengeComplete,
      );
    };
  }, [toast, refetch]);

  const equipAchievement = (achievementId) => {
    equipMutation.mutate(achievementId);
  };

  const unequipAchievement = (achievementId) => {
    unequipMutation.mutate(achievementId);
  };

  const markNotificationRead = (notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const value = {
    // Data
    achievements: achievementData?.achievements || [],
    equipped: achievementData?.equipped || [],
    stats: achievementData?.stats || {},
    notifications,

    // Loading states
    isLoading,
    error,

    // Actions
    equipAchievement,
    unequipAchievement,
    refetch,
    markNotificationRead,
    clearNotifications,

    // Mutation states
    isEquipping: equipMutation.isPending,
    isUnequipping: unequipMutation.isPending,
  };

  return (
    <AchievementContext.Provider value={value}>
      {children}
    </AchievementContext.Provider>
  );
};
