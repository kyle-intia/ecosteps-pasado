const DailyTracking = require("../models/DailyTracking");

async function getUserStats(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));
  startDate.setHours(0, 0, 0, 0);

  const entries = await DailyTracking.find({
    userId,
    date: { $gte: startDate },
  }).sort({ date: -1 });

  const totalEntries = entries.length;

  const avgFootprint =
    totalEntries > 0
      ? entries.reduce(
          (sum, entry) => sum + (entry.calculatedFootprint?.total || 0),
          0,
        ) / totalEntries
      : 0;

  return {
    period: `${days} days`,
    totalEntries,
    averageFootprint: Math.round(avgFootprint * 100) / 100,
    entries: entries.map((entry) => ({
      date: entry.date.toISOString().split("T")[0],
      footprint: entry.calculatedFootprint?.total || 0,
    })),
  };
}

async function getMonthlyStats(userId) {
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);

  const entries = await DailyTracking.find({
    userId,
    date: { $gte: startDate },
  }).sort({ date: -1 });

  const totalEntries = entries.length;

  const avgFootprint =
    totalEntries > 0
      ? entries.reduce(
          (sum, entry) => sum + (entry.calculatedFootprint?.total || 0),
          0,
        ) / totalEntries
      : 0;

  return {
    period: `${startDate.toLocaleString("default", { month: "long" })} ${startDate.getFullYear()}`,
    totalEntries,
    averageFootprint: Math.round(avgFootprint * 100) / 100,
    entries: entries.map((entry) => ({
      date: entry.date.toISOString().split("T")[0],
      footprint: entry.calculatedFootprint?.total || 0,
    })),
  };
}

module.exports = { getUserStats, getMonthlyStats };
