const Challenge = require("../models/Challenge");
const DailyTracking = require("../models/DailyTracking");
const DailyTrackingService = require("./dailyTrackingService");
const EcoChallengeService = require("../services/ecoChallengeService");

class ChallengeService {
  static async loadChallengeLibrary() {
    const challengesArray = await EcoChallengeService.getAllChallenges();

    const challengeLibrary = challengesArray.reduce((acc, challenge) => {
      acc[challenge.id] = challenge.toObject ? challenge.toObject() : challenge;
      return acc;
    }, {});

    return challengeLibrary;
  }

  static async hasCompletedDailyTracking(userId) {
    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const trackingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    return !!trackingEntry;
  }

  static async resetTodaysChallenges(userId) {
    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const challengeDoc = await Challenge.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!challengeDoc) {
      return { reset: false, message: "No challenges found for today" };
    }

    let resetCount = 0;
    challengeDoc.dailyChallenges.forEach((challenge) => {
      if (challenge.completed) {
        challenge.completed = false;
        challenge.completedAt = undefined;
        resetCount++;
      }
    });

    challengeDoc.isRecalculated = false;

    challengeDoc.calculationHistory.push({
      timestamp: new Date(),
      footprint: 0,
      source: "challenge_reset",
      challengeId: null,
    });

    await challengeDoc.save();

    return {
      reset: true,
      resetCount,
      message: `Reset ${resetCount} completed challenges due to daily tracking update`,
    };
  }

  static async selectDailyChallenges(userId) {
    const challengeLibrary = await this.loadChallengeLibrary();
    const categories = ["transport", "home", "food"];
    const selected = [];

    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const dateString = phNow.toISOString().split("T")[0];

    const seed = this.createDeterministicSeed(userId + dateString);

    categories.forEach((category) => {
      const categoryChallenges = Object.values(challengeLibrary).filter(
        (c) => c.category === category,
      );

      if (categoryChallenges.length === 0) {
        throw new Error(`No challenges found for category: ${category}`);
      }

      const challengeIndex =
        Math.floor(seed * categoryChallenges.length) %
        categoryChallenges.length;
      selected.push(categoryChallenges[challengeIndex]);
    });

    return selected;
  }

  static createDeterministicSeed(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = Math.abs(hash & hash);
    }

    return (hash % 999983) / 999983;
  }

  static async selectDailyChallengesByRotation(userId) {
    const challengeLibrary = await this.loadChallengeLibrary();
    const categories = ["transport", "home", "food"];
    const selected = [];

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    categories.forEach((category) => {
      const categoryChallenges = Object.values(challengeLibrary)
        .filter((c) => c.category === category)
        .sort((a, b) => a.id.localeCompare(b.id));

      if (categoryChallenges.length === 0) {
        throw new Error(`No challenges found for category: ${category}`);
      }

      const userIdHash = parseInt(userId.substring(0, 8), 16) || 0;
      const rotationBase = userIdHash + dayOfYear;
      const challengeIndex =
        (rotationBase + categories.indexOf(category) * 7) %
        categoryChallenges.length;

      selected.push(categoryChallenges[challengeIndex]);
    });

    return selected;
  }

  static async getTodaysChallenges(userId) {
    const hasTracking = await this.hasCompletedDailyTracking(userId);

    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let challengeDoc = await Challenge.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!challengeDoc) {
      const selectedChallenges =
        await this.selectDailyChallengesByRotation(userId);

      challengeDoc = new Challenge({
        userId: userId,
        date: today,
        dailyChallenges: selectedChallenges.map((challenge) => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          calculationType: challenge.calculationType,
          savingsValue: challenge.savingsValue,
          targetQuestion: challenge.targetQuestion,
          overrideValue: challenge.overrideValue,
          completed: false,
        })),
      });

      await challengeDoc.save();
    }

    challengeDoc.hasCompletedTracking = hasTracking;
    challengeDoc.trackingRequired = !hasTracking;

    return challengeDoc;
  }

  static async completeChallenge(userId, challengeId) {
    const AchievementService = require("./achievementService");
    const User = require("../models/user.model");

    const hasTracking = await this.hasCompletedDailyTracking(userId);
    if (!hasTracking) {
      throw new Error(
        "You must complete your daily tracking before attempting eco-challenges",
      );
    }

    const challengeDoc = await this.getTodaysChallenges(userId);

    const challenge = challengeDoc.dailyChallenges.find(
      (c) => c.id === challengeId,
    );
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.completed) {
      throw new Error("Challenge already completed");
    }

    challenge.completed = true;
    challenge.completedAt = new Date();

    const recalculationResult = await this.recalculateWithChallenges(
      userId,
      challengeDoc,
    );

    await challengeDoc.save();

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const co2Saved =
      typeof challenge.savingsValue === "number" ? challenge.savingsValue : 0;
    const updatedStats = await AchievementService.updateUserStats(
      userId,
      {
        totalChallengesCompleted: 1,
        [`${challenge.category}ChallengesCompleted`]: 1,
        totalCO2Saved: co2Saved,
      },
      true,
    );

    const newAchievements = await AchievementService.checkAchievements(
      userId,
      "CHALLENGE_COMPLETE",
      {
        dailyChallengesCompleted: challengeDoc.getCompletedCount(),
        challengeCategory: challenge.category,
        totalChallengesCompleted: updatedStats.totalChallengesCompleted,
      },
    );

    return {
      challengeDoc,
      recalculationResult,
      completedCount: challengeDoc.getCompletedCount(),
      allCompleted: challengeDoc.areAllCompleted(),
      newAchievements,
    };
  }

  static async recalculateWithChallenges(userId, challengeDoc) {
    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const trackingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    if (!trackingEntry) {
      return {
        message: "No tracking data found for today",
        recalculated: false,
      };
    }

    const originalFootprint = { ...trackingEntry.calculatedFootprint };

    const workingData = {
      transport: { ...trackingEntry.transport },
      homeEnergy: { ...trackingEntry.homeEnergy },
      food: { ...trackingEntry.food },
      flightType: trackingEntry.transport?.flightType || "no_flight",
    };

    const completedChallenges = challengeDoc.dailyChallenges.filter(
      (c) => c.completed,
    );
    let totalSavings = 0;

    for (const challenge of completedChallenges) {
      if (challenge.calculationType === "override") {
        this.applyChallengeOverride(workingData, challenge);
      } else if (challenge.calculationType === "fixed_credit") {
        totalSavings += Number(challenge.savingsValue) || 0;
      }
    }

    const recalculatedFootprint = DailyTrackingService.calculateDailyFootprint({
      transport: workingData.transport,
      flightType: workingData.flightType,
      homeType: workingData.homeEnergy?.homeType,
      occupants: workingData.homeEnergy?.occupants,
      appliances: workingData.homeEnergy?.appliances,
      breakfast: workingData.food?.breakfast,
      lunch: workingData.food?.lunch,
      dinner: workingData.food?.dinner,
    });

    recalculatedFootprint.total = Math.max(
      0,
      recalculatedFootprint.total - totalSavings,
    );

    trackingEntry.calculatedFootprint = recalculatedFootprint;
    challengeDoc.isRecalculated = true;

    challengeDoc.calculationHistory.push({
      timestamp: new Date(),
      footprint: recalculatedFootprint.total,
      source: "challenge_completion",
      challengeId: completedChallenges[completedChallenges.length - 1]?.id,
    });

    await trackingEntry.save();
    challengeDoc.dailyTrackingId = trackingEntry._id;

    return {
      recalculated: true,
      originalFootprint,
      newFootprint: recalculatedFootprint,
      savings: originalFootprint.total - recalculatedFootprint.total,
      appliedChallenges: completedChallenges.length,
    };
  }

  static applyChallengeOverride(workingData, challenge) {
    const { targetQuestion, overrideValue } = challenge;

    switch (targetQuestion) {
      case "Q1":
        if (overrideValue === "public_transport") {
          workingData.transport.modes = [
            { id: "public_transport", distance: 10 },
          ];
        } else if (overrideValue === "walking_5km") {
          workingData.transport.modes = [{ id: "walking", distance: 5 }];
        } else if (overrideValue === "no_commute") {
          workingData.transport.modes = [{ id: "no_travel", distance: 0 }];
        } else if (overrideValue === "bicycle") {
          workingData.transport.modes = [{ id: "bicycle", distance: 10 }];
        } else if (overrideValue === "carpool") {
          workingData.transport.modes = [{ id: "carpool", distance: 10 }];
        }
        break;

      case "Q2":
        if (overrideValue === "no") {
          workingData.flightType = "no_flight";
        }
        break;

      case "Q4":
        if (overrideValue === "5_occupants") {
          workingData.homeEnergy.occupants = 5;
        }
        break;

      case "Q5":
        if (overrideValue === "none" || overrideValue === "no_ac_heater") {
          workingData.homeEnergy.appliances = ["none"];
        }
        break;

      case "Q6,Q7,Q8":
        if (overrideValue === "plant_based") {
          workingData.food.breakfast = "plant";
          workingData.food.lunch = "plant";
          workingData.food.dinner = "plant";
        }
        break;

      case "Q7":
        if (overrideValue === "plant_based") {
          workingData.food.lunch = "plant";
        }
        break;
    }
  }

  static async regenerateTodaysChallenges(userId) {
    const now = new Date();
    const phOffset = 8 * 60;
    const phNow = new Date(now.getTime() + phOffset * 60 * 1000);

    const today = new Date(phNow);
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    await Challenge.deleteOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow },
    });

    return await this.getTodaysChallenges(userId);
  }

  static async getChallengeStats(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const challengeDocs = await Challenge.find({
      userId: userId,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    let totalChallenges = 0;
    let completedChallenges = 0;
    let perfectDays = 0;

    challengeDocs.forEach((doc) => {
      totalChallenges += doc.dailyChallenges.length;
      completedChallenges += doc.getCompletedCount();
      if (doc.areAllCompleted()) perfectDays++;
    });

    return {
      period: `${days} days`,
      totalChallenges,
      completedChallenges,
      completionRate:
        totalChallenges > 0
          ? Math.round((completedChallenges / totalChallenges) * 100)
          : 0,
      perfectDays,
      activeDays: challengeDocs.length,
    };
  }

  static async getAllChallenges() {
    const challengeLibrary = await this.loadChallengeLibrary();
    const challenges = Object.values(challengeLibrary);
    return {
      transport: challenges.filter((c) => c.category === "transport"),
      home: challenges.filter((c) => c.category === "home"),
      food: challenges.filter((c) => c.category === "food"),
      total: challenges.length,
    };
  }
}

module.exports = ChallengeService;
