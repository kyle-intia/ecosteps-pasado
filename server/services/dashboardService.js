// server/services/dashboardService.js
const DailyTracking = require('../models/DailyTracking');
const PreAssessment = require('../models/PreAssessment');
const Challenge = require('../models/Challenge');
const ChallengeService = require('./challengeService');

class DashboardService {
  /**
   * Get comprehensive dashboard summary
   * @param {string} userId - User ID
   * @returns {Object} Dashboard data
   */
  static async getDashboardSummary(userId) {
    try {
      // Get current month data
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Get last month for comparison
      const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const endOfLastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      // Fetch current month tracking data
      const currentMonthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      }).sort({ date: -1 });
      
      // Fetch last month data for comparison
      const lastMonthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: lastMonth, $lte: endOfLastMonth }
      });
      
      // Get pre-assessment baseline
      const preAssessment = await PreAssessment.findOne({ userId }).sort({ createdAt: -1 });
      
      // Get challenge statistics
      const challengeStats = await ChallengeService.getChallengeStats(userId, 30);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(currentMonthData, lastMonthData, preAssessment);
      
      // Get chart data
      const monthlyTrend = await this.getMonthlyTrends(userId, 6);
      const categoryBreakdown = this.calculateCategoryBreakdown(currentMonthData);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(currentMonthData, preAssessment);
      
      return {
        metrics,
        charts: {
          monthlyTrend,
          categoryBreakdown
        },
        recommendations,
        challengeStats,
        summary: {
          totalEntries: currentMonthData.length,
          avgDailyFootprint: metrics.currentEmissions / (currentMonthData.length || 1),
          bestDay: this.getBestDay(currentMonthData),
          worstDay: this.getWorstDay(currentMonthData)
        }
      };
    } catch (error) {
      console.error('Dashboard service error:', error);
      throw error;
    }
  }
  
  /**
   * Calculate key metrics
   * @param {Array} currentData - Current month tracking data
   * @param {Array} lastData - Last month tracking data
   * @param {Object} preAssessment - Pre-assessment data
   * @returns {Object} Calculated metrics
   */
  static calculateMetrics(currentData, lastData, preAssessment) {
    // Calculate current month average (in tons)
    const currentTotal = currentData.reduce((sum, entry) => 
      sum + (entry.calculatedFootprint?.total || 0), 0);
    const currentEmissions = currentData.length > 0 ? 
      (currentTotal / currentData.length) * 30 / 1000 : 0; // Convert to tons per month
    
    // Calculate last month average
    const lastTotal = lastData.reduce((sum, entry) => 
      sum + (entry.calculatedFootprint?.total || 0), 0);
    const lastEmissions = lastData.length > 0 ? 
      (lastTotal / lastData.length) * 30 / 1000 : currentEmissions;
    
    // Calculate reduction percentage
    const reductionPercentage = lastEmissions > 0 ? 
      ((lastEmissions - currentEmissions) / lastEmissions * 100) : 0;
    
    // Target based on pre-assessment (20% reduction from baseline)
    const baselineAnnual = preAssessment?.results?.totalCO2 || 5000; // kg per year
    const targetEmissions = (baselineAnnual * 0.8) / 12 / 1000; // 20% reduction, monthly, in tons
    
    // Calculate eco score (1000 - current emissions in kg per month)
    const ecoScore = Math.max(0, 1000 - (currentEmissions * 1000));
    
    // Calculate trees saved (1 tree = ~22kg CO2 per year)
    const annualSavings = (lastEmissions - currentEmissions) * 12 * 1000; // kg per year
    const treesSaved = Math.max(0, Math.round(annualSavings / 22));
    
    return {
      currentEmissions: Math.round(currentEmissions * 100) / 100,
      targetEmissions: Math.round(targetEmissions * 100) / 100,
      reductionPercentage: Math.round(reductionPercentage * 10) / 10,
      ecoScore: Math.round(ecoScore),
      treesSaved,
      trend: reductionPercentage > 0 ? 'improving' : 'worsening'
    };
  }
  
  /**
   * Get monthly trends data
   * @param {string} userId - User ID
   * @param {number} months - Number of months to fetch
   * @returns {Array} Monthly trend data
   */
  static async getMonthlyTrends(userId, months = 6) {
    const trends = [];
    const currentDate = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthData = await DailyTracking.find({
        userId: userId,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });
      
      const totalEmissions = monthData.reduce((sum, entry) => 
        sum + (entry.calculatedFootprint?.total || 0), 0);
      const avgDaily = monthData.length > 0 ? totalEmissions / monthData.length : 0;
      const monthlyEmissions = (avgDaily * 30) / 1000; // Convert to tons per month
      
      // Calculate savings compared to first month
      const savings = i === months - 1 ? 0 : Math.max(0, trends[0]?.emissions - monthlyEmissions);
      
      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        emissions: Math.round(monthlyEmissions * 100) / 100,
        savings: Math.round(savings * 100) / 100
      });
    }
    
    return trends;
  }
  
  /**
   * Calculate category breakdown
   * @param {Array} data - Tracking data
   * @returns {Array} Category breakdown
   */
  static calculateCategoryBreakdown(data) {
    if (data.length === 0) {
      return [
        { name: "Transportation", value: 33, color: "hsl(var(--destructive))" },
        { name: "Energy", value: 33, color: "hsl(var(--warning))" },
        { name: "Food", value: 34, color: "hsl(var(--accent))" }
      ];
    }
    
    const totals = data.reduce((acc, entry) => {
      acc.transport += entry.calculatedFootprint?.transport || 0;
      acc.homeEnergy += entry.calculatedFootprint?.homeEnergy || 0;
      acc.food += entry.calculatedFootprint?.food || 0;
      return acc;
    }, { transport: 0, homeEnergy: 0, food: 0 });
    
    const total = totals.transport + totals.homeEnergy + totals.food;
    
    if (total === 0) {
      return [
        { name: "Transportation", value: 33, color: "hsl(var(--destructive))" },
        { name: "Energy", value: 33, color: "hsl(var(--warning))" },
        { name: "Food", value: 34, color: "hsl(var(--accent))" }
      ];
    }
    
    return [
      {
        name: "Transportation",
        value: Math.round((totals.transport / total) * 100),
        color: "hsl(var(--destructive))"
      },
      {
        name: "Energy",
        value: Math.round((totals.homeEnergy / total) * 100),
        color: "hsl(var(--warning))"
      },
      {
        name: "Food",
        value: Math.round((totals.food / total) * 100),
        color: "hsl(var(--accent))"
      }
    ];
  }
  
  /**
   * Generate personalized recommendations
   * @param {Array} data - Current tracking data
   * @param {Object} preAssessment - Pre-assessment data
   * @returns {Array} Recommendations
   */
  static generateRecommendations(data, preAssessment) {
    const recommendations = [];
    
    if (data.length === 0) {
      return [
        {
          icon: "Car",
          title: "Start tracking your daily commute",
          description: "Regular tracking helps identify improvement opportunities",
          category: "transport"
        },
        {
          icon: "Zap", 
          title: "Monitor your energy usage",
          description: "Track home energy consumption to find savings",
          category: "energy"
        }
      ];
    }
    
    // Analyze patterns
    const avgFootprint = data.reduce((acc, entry) => {
      acc.transport += entry.calculatedFootprint?.transport || 0;
      acc.homeEnergy += entry.calculatedFootprint?.homeEnergy || 0;
      acc.food += entry.calculatedFootprint?.food || 0;
      return acc;
    }, { transport: 0, homeEnergy: 0, food: 0 });
    
    Object.keys(avgFootprint).forEach(key => {
      avgFootprint[key] = avgFootprint[key] / data.length;
    });
    
    // Transport recommendations
    if (avgFootprint.transport > 5) { // High transport emissions
      recommendations.push({
        icon: "Car",
        title: "Try carpooling 2 days per week",
        description: `Could save up to ${Math.round(avgFootprint.transport * 0.4 * 30 / 1000 * 100) / 100} tons CO₂ monthly`,
        category: "transport"
      });
    }
    
    // Energy recommendations
    if (avgFootprint.homeEnergy > 3) { // High energy usage
      recommendations.push({
        icon: "Zap",
        title: "Switch to LED bulbs",
        description: "Reduce home energy consumption by 15%",
        category: "energy"
      });
    }
    
    // Food recommendations
    if (avgFootprint.food > 8) { // High food emissions
      recommendations.push({
        icon: "Utensils",
        title: "Try meatless Mondays",
        description: `Could save up to ${Math.round(avgFootprint.food * 0.2 * 30 / 1000 * 100) / 100} tons CO₂ monthly`,
        category: "food"
      });
    }
    
    return recommendations.slice(0, 3); // Limit to 3 recommendations
  }
  
  /**
   * Get best performing day
   * @param {Array} data - Tracking data
   * @returns {Object} Best day info
   */
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
      dateString: new Date(bestDay.date).toLocaleDateString()
    };
  }
  
  /**
   * Get worst performing day
   * @param {Array} data - Tracking data
   * @returns {Object} Worst day info
   */
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
      dateString: new Date(worstDay.date).toLocaleDateString()
    };
  }
}

module.exports = DashboardService;