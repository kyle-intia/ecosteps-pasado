const User = require("../models/user.model").default;
const AchievementService = require("./achievementService");

const Challenge = require("../models/Challenge");

let CO2_FACTORS_DAILY = null;

class DailyTrackingService {
  static init(factors) {
    CO2_FACTORS_DAILY = factors;
  }

  static calculateTransport(transportData, flightType) {
    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    let transportTotal = 0;

    const safeTransport = transportData || {};
    const modes = Array.isArray(safeTransport.modes) ? safeTransport.modes : [];
    const distances =
      typeof safeTransport.distances === "object" &&
      safeTransport.distances !== null
        ? safeTransport.distances
        : {};

    if (modes.length > 0) {
      modes.forEach((mode) => {
        const modeId = typeof mode === "string" ? mode : mode.id;
        const distanceFromMap = Number(distances[modeId]) || 0;
        const distanceFromMode =
          typeof mode === "object" &&
          mode &&
          typeof mode.distance !== "undefined"
            ? Number(mode.distance) || 0
            : 0;
        const distance = Math.max(distanceFromMap, distanceFromMode);
        const factor = CO2_FACTORS_DAILY.transport[modeId] || 0;
        transportTotal += distance * factor;
      });
    }

    const normalizedFlight = (() => {
      const v = (flightType || "").replace("-", "_");
      if (v === "none") return "no_flight";
      return v;
    })();
    const flightEmission = CO2_FACTORS_DAILY.flights[normalizedFlight] || 0;
    transportTotal += flightEmission;

    return transportTotal;
  }

  static calculateHomeEnergy(homeType, occupants, appliances) {
    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    const normalizedHomeType = (homeType || "").replace("-", "_");
    const annualHouseholdFootprint =
      CO2_FACTORS_DAILY.homeEnergy[normalizedHomeType] || 0;

    const numOccupants = Math.max(1, Number(occupants) || 1);
    const dailyPerPersonBase = annualHouseholdFootprint / 365 / numOccupants;

    let applianceIncrease = 0;
    const list = Array.isArray(appliances) ? appliances : [];
    list.forEach((appliance) => {
      const key = (appliance || "").replace("-", "_");
      applianceIncrease += CO2_FACTORS_DAILY.appliances[key] || 0;
    });

    const dailyHomeEnergy = dailyPerPersonBase * (1 + applianceIncrease / 100);
    return dailyHomeEnergy;
  }

  static calculateFood(breakfast, lunch, dinner) {
    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    const normalize = (value) => {
      const v = (value || "").replace("-", "_");
      if (v === "none") return "skipped";
      if (v === "plant_based") return "plant";
      return v;
    };
    const breakfastEmission =
      CO2_FACTORS_DAILY.food[`breakfast_${normalize(breakfast)}`] || 0;
    const lunchEmission =
      CO2_FACTORS_DAILY.food[`lunch_${normalize(lunch)}`] || 0;
    const dinnerEmission =
      CO2_FACTORS_DAILY.food[`dinner_${normalize(dinner)}`] || 0;

    return breakfastEmission + lunchEmission + dinnerEmission;
  }

  static calculateDailyFootprint(responses) {
    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    const validation = this.validateDailyResponses(responses);
    if (!validation.isValid) {
      throw new Error(`Invalid responses: ${validation.errors.join(", ")}`);
    }

    const transport = this.calculateTransport(
      responses.transport,
      responses.flightType || "no_flight",
    );

    let homeEnergy = 0;
    if (responses.occupants && Number(responses.occupants) > 0) {
      homeEnergy = this.calculateHomeEnergy(
        responses.homeType,
        responses.occupants,
        responses.appliances || [],
      );
    }

    const food = this.calculateFood(
      responses.breakfast || "skipped",
      responses.lunch || "skipped",
      responses.dinner || "skipped",
    );

    const total = transport + homeEnergy + food;

    return {
      transport: Math.round(transport * 100) / 100,
      homeEnergy: Math.round(homeEnergy * 100) / 100,
      food: Math.round(food * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  static async resetChallengesOnTrackingUpdate(userId) {
    try {
      const now = new Date();

      const phNow = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Manila" }),
      );

      const today = new Date(
        Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()),
      );

      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const challengeDoc = await Challenge.findOne({
        userId: userId,
        date: { $gte: today, $lt: tomorrow },
      });

      if (!challengeDoc) {
        return { message: "No challenge document found for today" };
      }

      challengeDoc.dailyChallenges.forEach((challenge) => {
        challenge.completed = false;
        challenge.completedAt = null;
      });

      challengeDoc.isRecalculated = true;

      await challengeDoc.save();

      return { message: "Challenges reset successfully" };
    } catch (error) {
      console.error("Error resetting challenges:", error);
      throw error;
    }
  }

  static validateDailyResponses(responses) {
    const errors = [];
    const safe = responses || {};

    if (safe.transport && Array.isArray(safe.transport.modes)) {
      safe.transport.modes.forEach((mode) => {
        const modeId = typeof mode === "string" ? mode : mode.id;
        if (
          !Object.prototype.hasOwnProperty.call(
            CO2_FACTORS_DAILY.transport,
            modeId,
          )
        ) {
          errors.push(`Invalid transport mode: ${modeId}`);
        }
      });
    }

    if (safe.flightType) {
      const normalizedFlight = (() => {
        const v = String(safe.flightType).replace("-", "_");
        if (v === "none") return "no_flight";
        return v;
      })();
      if (
        !Object.prototype.hasOwnProperty.call(
          CO2_FACTORS_DAILY.flights,
          normalizedFlight,
        )
      ) {
        errors.push("Invalid flight type");
      }
    }

    if (safe.homeType) {
      const normalizedHomeType = safe.homeType.replace("-", "_");
      if (
        !Object.prototype.hasOwnProperty.call(
          CO2_FACTORS_DAILY.homeEnergy,
          normalizedHomeType,
        )
      ) {
        errors.push("Invalid home type");
      }
    }

    if (
      safe.occupants &&
      (isNaN(Number(safe.occupants)) || Number(safe.occupants) < 0)
    ) {
      errors.push("Occupants must be a number greater than or equal to 0");
    }

    if (safe.appliances && Array.isArray(safe.appliances)) {
      safe.appliances.forEach((appliance) => {
        let key = (appliance || "").replace("-", "_");
        if (key === "aircon") key = "ac_heating";
        if (
          !Object.prototype.hasOwnProperty.call(
            CO2_FACTORS_DAILY.appliances,
            key,
          )
        ) {
          errors.push(`Invalid appliance: ${appliance}`);
        }
      });
    }

    const foodTypes = ["meat", "fish", "dairy", "mixed", "plant", "skipped"];
    ["breakfast", "lunch", "dinner"].forEach((meal) => {
      if (safe[meal]) {
        const normalized = safe[meal].replace("-", "_");
        const mapped =
          normalized === "none"
            ? "skipped"
            : normalized === "plant_based"
              ? "plant"
              : normalized;
        if (!foodTypes.includes(mapped)) {
          errors.push(`Invalid ${meal} type: ${safe[meal]}`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async handleTrackingAchievements(
    userId,
    calculatedFootprint,
    trackingData,
  ) {
    try {
      const user = await User.findById(userId);
      const today = new Date().toDateString();
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toDateString();

      let currentStreak = 1;
      if (
        user.achievementStats.lastTrackingDate &&
        new Date(user.achievementStats.lastTrackingDate).toDateString() ===
          yesterday
      ) {
        currentStreak = user.achievementStats.currentStreak + 1;
      }

      await AchievementService.updateUserStats(userId, {
        totalTrackingDays: user.achievementStats.totalTrackingDays + 1,
        currentStreak: currentStreak,
        maxStreak: Math.max(user.achievementStats.maxStreak, currentStreak),
        lastTrackingDate: new Date(),
      });

      const newAchievements = await AchievementService.checkAchievements(
        userId,
        "DAILY_TRACKING_COMPLETE",
        {
          dailyFootprint: calculatedFootprint.total,
          submitted: true,
          isCarFree: !trackingData.transport.modes.some((m) => m.id === "car"),
          isPlantBased: [
            trackingData.food.breakfast,
            trackingData.food.lunch,
            trackingData.food.dinner,
          ].every((meal) => meal === "plant"),
        },
      );

      return newAchievements;
    } catch (error) {
      console.error("Error handling tracking achievements:", error);
      return [];
    }
  }
}

module.exports = DailyTrackingService;
