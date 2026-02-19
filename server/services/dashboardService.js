const DailyTracking = require("../models/DailyTracking");
const PreAssessment = require("../models/PreAssessment");
const Challenge = require("../models/Challenge");
const Recommendation = require("../models/Recommendation");
const ChallengeService = require("./challengeService");
const AIRecommendationService = require("./aiRecommendationService");
const LeaderboardService = require("./leaderboardService");

class DashboardService {
  static async getDashboardSummary(userId) {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1,
      );
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0,
      );

      const lastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1,
      );
      const endOfLastMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        0,
      );

      const currentMonthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).sort({ date: -1 });

      const lastMonthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: lastMonth, $lte: endOfLastMonth },
      });

      const preAssessment = await PreAssessment.findOne({ userId }).sort({
        createdAt: -1,
      });

      const challengeStats = await ChallengeService.getChallengeStats(
        userId,
        30,
      );

      const metrics = this.calculateMetrics(
        currentMonthData,
        lastMonthData,
        preAssessment,
      );

      const monthlyTrend = await this.getMonthlyTrends(userId, 6);
      const categoryBreakdown =
        this.calculateCategoryBreakdown(currentMonthData);

      const recommendations = await this.generateRecommendations(
        currentMonthData,
        preAssessment,
      );

      return {
        metrics,
        charts: {
          monthlyTrend,
          categoryBreakdown,
        },
        recommendations,
        challengeStats,
        summary: {
          totalEntries: currentMonthData.length,
          avgDailyFootprint:
            metrics.currentEmissions / (currentMonthData.length || 1),
          bestDay: this.getBestDay(currentMonthData),
          worstDay: this.getWorstDay(currentMonthData),
        },
      };
    } catch (error) {
      console.error("Dashboard service error:", error);
      throw error;
    }
  }

  static calculateMetrics(currentData, lastData, preAssessment) {
    const currentTotal = currentData.reduce(
      (sum, entry) => sum + (entry.calculatedFootprint?.total || 0),
      0,
    );
    const currentEmissions =
      currentData.length > 0
        ? ((currentTotal / currentData.length) * 30) / 1000
        : 0;

    const lastTotal = lastData.reduce(
      (sum, entry) => sum + (entry.calculatedFootprint?.total || 0),
      0,
    );
    const lastEmissions =
      lastData.length > 0
        ? ((lastTotal / lastData.length) * 30) / 1000
        : currentEmissions;

    const reductionPercentage =
      lastEmissions > 0
        ? ((lastEmissions - currentEmissions) / lastEmissions) * 100
        : 0;

    const baselineAnnual = preAssessment?.results?.totalCO2 || 5000;
    const targetEmissions = (baselineAnnual * 0.8) / 12 / 1000;

    const ecoScore = Math.max(0, 1000 - currentEmissions * 1000);

    const annualSavings = (lastEmissions - currentEmissions) * 12 * 1000;
    const treesSaved = Math.max(0, Math.round(annualSavings / 22));

    const c02Saved = Math.max(0, (lastEmissions - currentEmissions) * 1000);

    return {
      baselineAnnual,
      currentEmissions: Math.round(currentEmissions * 100) / 100,
      targetEmissions: Math.round(targetEmissions * 100) / 100,
      reductionPercentage: Math.round(reductionPercentage * 10) / 10,
      ecoScore: Math.round(ecoScore),
      treesSaved,
      c02Saved: Math.round(c02Saved),
      trend: reductionPercentage > 0 ? "improving" : "worsening",
    };
  }

  static async getMonthlyTrends(userId, months = 6) {
    const trends = [];
    const currentDate = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - i,
        1,
      );
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const totalEmissions = monthData.reduce(
        (sum, entry) => sum + (entry.calculatedFootprint?.total || 0),
        0,
      );
      const avgDaily =
        monthData.length > 0 ? totalEmissions / monthData.length : 0;
      const monthlyEmissions = (avgDaily * 30) / 1000;

      const savings =
        i === months - 1
          ? 0
          : Math.max(0, trends[0]?.emissions - monthlyEmissions);

      trends.push({
        month: date.toLocaleDateString("en-US", { month: "short" }),
        emissions: Math.round(monthlyEmissions * 100) / 100,
        savings: Math.round(savings * 100) / 100,
      });
    }

    return trends;
  }

  static calculateCategoryBreakdown(data) {
    if (data.length === 0) {
      return [
        { name: "Transportation", value: 33, color: "hsl(var(--destructive))" },
        { name: "Energy", value: 33, color: "hsl(var(--warning))" },
        { name: "Food", value: 34, color: "hsl(var(--accent))" },
      ];
    }

    const totals = data.reduce(
      (acc, entry) => {
        acc.transport += entry.calculatedFootprint?.transport || 0;
        acc.homeEnergy += entry.calculatedFootprint?.homeEnergy || 0;
        acc.food += entry.calculatedFootprint?.food || 0;
        return acc;
      },
      { transport: 0, homeEnergy: 0, food: 0 },
    );

    const total = totals.transport + totals.homeEnergy + totals.food;

    if (total === 0) {
      return [
        { name: "Transportation", value: 33, color: "hsl(var(--destructive))" },
        { name: "Energy", value: 33, color: "hsl(var(--warning))" },
        { name: "Food", value: 34, color: "hsl(var(--accent))" },
      ];
    }

    return [
      {
        name: "Transportation",
        value: Math.round((totals.transport / total) * 100),
        color: "hsl(var(--destructive))",
      },
      {
        name: "Energy",
        value: Math.round((totals.homeEnergy / total) * 100),
        color: "hsl(var(--warning))",
      },
      {
        name: "Food",
        value: Math.round((totals.food / total) * 100),
        color: "hsl(var(--accent))",
      },
    ];
  }

  static async generateRecommendations(data, preAssessment) {
    try {
      if (data.length === 0) {
        return [
          {
            id: "no-data-rec-1",
            title: "Start tracking your daily commute",
            description:
              "Regular tracking helps identify improvement opportunities",
            category: "transport",
            estimatedSavings: 0.5,
            priority: 1,
            source: "ai_generated",
            actionable: true,
          },
          {
            id: "no-data-rec-2",
            title: "Monitor your energy usage",
            description: "Track home energy consumption to find savings",
            category: "energy",
            estimatedSavings: 0.3,
            priority: 2,
            source: "ai_generated",
            actionable: true,
          },
        ];
      }

      const latestFootprint = data[0];

      const existingRecommendations = await Recommendation.findOne({
        userId: latestFootprint.userId,
        footprintId: latestFootprint._id,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) },
      });

      if (existingRecommendations) {
        console.log("Using cached AI recommendations for dashboard");
        return existingRecommendations.recommendations.map((rec, index) => ({
          id: `cached-rec-${index}`,
          title: rec.title,
          description: rec.description,
          category: rec.category === "home" ? "energy" : rec.category,
          estimatedSavings: rec.estimatedSavings || 0.5,
          priority: index + 1,
          source: "ai_generated",
          actionable: true,
        }));
      }

      const footprintData = {
        breakdown: latestFootprint.calculatedFootprint,
        transportModes: latestFootprint.rawAnswers?.transport?.modes || [],
        homeType:
          latestFootprint.rawAnswers?.homeEnergy?.homeType ||
          latestFootprint.homeEnergy?.homeType,
        occupants:
          latestFootprint.rawAnswers?.homeEnergy?.occupants ||
          latestFootprint.homeEnergy?.occupants,
        appliances:
          latestFootprint.rawAnswers?.homeEnergy?.appliances ||
          latestFootprint.homeEnergy?.appliances,
        meals: latestFootprint.rawAnswers?.food || {
          breakfast: latestFootprint.food?.breakfast,
          lunch: latestFootprint.food?.lunch,
          dinner: latestFootprint.food?.dinner,
        },
      };

      console.log("Generating AI recommendations for dashboard with data:", {
        totalEmissions: footprintData.breakdown.total,
        categories: Object.keys(footprintData.breakdown),
      });

      const aiResponse =
        await AIRecommendationService.generateRecommendations(footprintData);

      const recommendationDoc = new Recommendation({
        userId: latestFootprint.userId,
        footprintId: latestFootprint._id,
        footprintSummary: {
          total: footprintData.breakdown.total,
          transport: footprintData.breakdown.transport,
          homeEnergy: footprintData.breakdown.homeEnergy,
          food: footprintData.breakdown.food,
          date: latestFootprint.date,
        },
        recommendations: aiResponse.recommendations,
        aiMetadata: {
          model: aiResponse.model,
          processingTime: aiResponse.processingTime,
          prompt: aiResponse.prompt,
          rawResponse: aiResponse.rawResponse,
        },
      });

      await recommendationDoc.save();
      console.log(
        "AI recommendations generated and saved for dashboard:",
        recommendationDoc._id,
      );

      return aiResponse.recommendations.map((rec, index) => ({
        id: `dashboard-rec-${index}`,
        title: rec.title,
        description: rec.description,
        category: rec.category === "home" ? "energy" : rec.category,
        estimatedSavings: rec.estimatedSavings || 0.5,
        priority: index + 1,
        source: "ai_generated",
        actionable: true,
      }));
    } catch (error) {
      console.error(
        "Error generating AI recommendations for dashboard:",
        error,
      );

      return [
        {
          id: "fallback-rec-1",
          title: "Reduce transport emissions",
          description:
            "Consider carpooling or using public transport to lower your carbon footprint",
          category: "transport",
          estimatedSavings: 0.5,
          priority: 1,
          source: "ai_generated",
          actionable: true,
        },
        {
          id: "fallback-rec-2",
          title: "Optimize energy usage",
          description:
            "Use energy-efficient appliances and turn off devices when not in use",
          category: "energy",
          estimatedSavings: 0.3,
          priority: 2,
          source: "ai_generated",
          actionable: true,
        },
        {
          id: "fallback-rec-3",
          title: "Choose sustainable food options",
          description:
            "Opt for plant-based meals and locally sourced food when possible",
          category: "food",
          estimatedSavings: 0.4,
          priority: 3,
          source: "ai_generated",
          actionable: true,
        },
      ];
    }
  }

  static getBestDay(data) {
    if (data.length === 0) return null;

    const bestDay = data.reduce((min, current) => {
      const currentTotal = current.calculatedFootprint?.total || Infinity;
      const minTotal = min.calculatedFootprint?.total || Infinity;
      return currentTotal < minTotal ? current : min;
    });

    return {
      date: bestDay.date,
      emissions: bestDay.calculatedFootprint?.total || 0,
      dateString: new Date(bestDay.date).toLocaleDateString(),
    };
  }

  static getWorstDay(data) {
    if (data.length === 0) return null;

    const worstDay = data.reduce((max, current) => {
      const currentTotal = current.calculatedFootprint?.total || 0;
      const maxTotal = max.calculatedFootprint?.total || 0;
      return currentTotal > maxTotal ? current : max;
    });

    return {
      date: worstDay.date,
      emissions: worstDay.calculatedFootprint?.total || 0,
      dateString: new Date(worstDay.date).toLocaleDateString(),
    };
  }

  static async regenerateRecommendations(userId) {
    try {
      const latestFootprint = await DailyTracking.findOne({
        userId: userId,
      }).sort({ createdAt: -1 });

      if (!latestFootprint) {
        throw new Error("No footprint data found for user");
      }

      const preAssessment = await PreAssessment.findOne({ userId }).sort({
        createdAt: -1,
      });

      const recommendations = await this.generateRecommendations(
        [latestFootprint],
        preAssessment,
      );

      return {
        recommendations,
        footprintData: {
          id: latestFootprint._id,
          footprintId: latestFootprint._id,
          calculatedFootprint: latestFootprint.calculatedFootprint,
          breakdown: latestFootprint.calculatedFootprint,
        },
        message: "Recommendations regenerated successfully",
      };
    } catch (error) {
      console.error("Error regenerating recommendations:", error);
      throw new Error(`Failed to regenerate recommendations: ${error.message}`);
    }
  }
}

module.exports = DashboardService;
