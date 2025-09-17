// server/services/challengeService.js
// Updated service with daily tracking validation and challenge reset functionality

const Challenge = require('../models/Challenge');
const DailyTracking = require('../models/DailyTracking');
const DailyTrackingService = require('./dailyTrackingService');

// Challenge library from the implementation prompt
const CHALLENGE_LIBRARY = {
  // Transport challenges
  car_free_commute: {
    id: "car_free_commute",
    title: "Car-Free Commuter",
    description: "Use public transport, bike, or walk for your entire commute today. Every mile counts!",
    category: "transport",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q1",
    overrideValue: "public_transport"
  },
  flight_free_day: {
    id: "flight_free_day",
    title: "Flight-Free Day",
    description: "Keep your feet on the ground! Avoid taking any flights today.",
    category: "transport",
    calculationType: "override",
    savingsValue: 150,
    targetQuestion: "Q2",
    overrideValue: "no"
  },
  walking_warrior: {
    id: "walking_warrior",
    title: "Walking Warrior",
    description: "Walk for at least 5 km for your errands or commute today. Your body and planet will thank you!",
    category: "transport",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q1",
    overrideValue: "walking_5km"
  },
  telecommute_champion: {
    id: "telecommute_champion",
    title: "Telecommute Champion",
    description: "Work from home and avoid travelling today.",
    category: "transport",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q1",
    overrideValue: "no_commute"
  },

  // Home challenges
  full_house: {
    id: "full_house",
    title: "Full House",
    description: "Share your home with 5+ people to reduce per-person energy use.",
    category: "home",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q4",
    overrideValue: "5_occupants"
  },
  unplugged_day: {
    id: "unplugged_day",
    title: "Unplugged Day",
    description: "Avoid using high-energy appliances (AC, heater, laundry) today.",
    category: "home",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q5",
    overrideValue: "none"
  },
  thermostat_titan: {
    id: "thermostat_titan",
    title: "Thermostat Titan",
    description: "Set AC to 26°C/heater to 18°C for the whole day.",
    category: "home",
    calculationType: "override",
    savingsValue: "calculated",
    targetQuestion: "Q5",
    overrideValue: "no_ac_heater"
  },
  natural_power_hour: {
    id: "natural_power_hour",
    title: "Natural Power Hour",
    description: "Turn off non-essential electronics during peak hours (7-8 PM).",
    category: "home",
    calculationType: "fixed_credit",
    savingsValue: 0.5
  },
  air_dry_ambassador: {
    id: "air_dry_ambassador",
    title: "Air Dry Ambassador",
    description: "Hang clothes to dry instead of using the dryer.",
    category: "home",
    calculationType: "fixed_credit",
    savingsValue: 2.0
  },

  // Food challenges
  meat_free_munchday: {
    id: "meat_free_munchday",
    title: "Meat-Free Munchday",
    description: "Go fully plant-based for all meals today.",
    category: "food",
    calculationType: "override",
    savingsValue: 6.0,
    targetQuestion: "Q6,Q7,Q8",
    overrideValue: "plant_based"
  },
  leftover_legend: {
    id: "leftover_legend",
    title: "Leftover Legend",
    description: "Fight food waste! Eat leftovers for at least one meal today.",
    category: "food",
    calculationType: "override",
    savingsValue: 2.0,
    targetQuestion: "Q7",
    overrideValue: "plant_based"
  },
  palengke_patron: {
    id: "palengke_patron",
    title: "Palengke Patron",
    description: "Buy fresh produce from the palengke or talipapa instead of imported goods. Support local farmers.",
    category: "food",
    calculationType: "fixed_credit",
    savingsValue: 0.5
  }
};

class ChallengeService {
  /**
   * Check if user has completed daily tracking for today
   * @param {string} userId - User identifier
   * @returns {Promise<boolean>} Whether user has daily tracking entry
   */
  static async hasCompletedDailyTracking(userId) {
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const trackingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    return !!trackingEntry;
  }

  /**
   * Reset all completed challenges for a user today
   * @param {string} userId - User identifier
   * @returns {Promise<Object>} Reset result
   */
  static async resetTodaysChallenges(userId) {
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const challengeDoc = await Challenge.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!challengeDoc) {
      return { reset: false, message: 'No challenges found for today' };
    }
    
    let resetCount = 0;
    challengeDoc.dailyChallenges.forEach(challenge => {
      if (challenge.completed) {
        challenge.completed = false;
        challenge.completedAt = undefined;
        resetCount++;
      }
    });
    
    // Reset recalculation flags
    challengeDoc.isRecalculated = false;
    
    // Add to calculation history
    challengeDoc.calculationHistory.push({
      timestamp: new Date(),
      footprint: 0,
      source: 'challenge_reset',
      challengeId: null
    });
    
    await challengeDoc.save();
    
    return {
      reset: true,
      resetCount,
      message: `Reset ${resetCount} completed challenges due to daily tracking update`
    };
  }

  /**
   * Challenge Selection Algorithm - selects 3 unique challenges (one from each category)
   * @param {string} userId - User identifier for consistent daily selection
   * @returns {Array} Array of 3 selected challenges
   */
  static selectDailyChallenges(userId) {
    const challenges = Object.values(CHALLENGE_LIBRARY);
    const categories = ['transport', 'home', 'food'];
    const selected = [];
    
    // Create a pseudo-random seed based on user ID and current date
    const today = new Date().toISOString().split('T')[0];
    const seed = this.generateSeed(userId + today);
    
    categories.forEach(category => {
      const categoryOptions = challenges.filter(c => c.category === category);
      const index = Math.abs(seed * categoryOptions.length) % categoryOptions.length;
      selected.push(categoryOptions[Math.floor(index)]);
    });
    
    return selected;
  }
  
  /**
   * Generate a consistent pseudo-random seed for challenge selection
   * @param {string} input - Input string to generate seed from
   * @returns {number} Pseudo-random number
   */
  static generateSeed(input) {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1 range
  }
  
  /**
   * Get or create today's challenges for a user
   * @param {string} userId - User ID
   * @returns {Object} Challenge document with today's challenges and tracking status
   */
  static async getTodaysChallenges(userId) {
    // Check if user has completed daily tracking first
    const hasTracking = await this.hasCompletedDailyTracking(userId);
    
    // Get today's date in Philippines timezone
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    // Check if challenges already exist for today
    let challengeDoc = await Challenge.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!challengeDoc) {
      // Generate new challenges for today
      const selectedChallenges = this.selectDailyChallenges(userId);
      
      challengeDoc = new Challenge({
        userId: userId,
        date: today,
        dailyChallenges: selectedChallenges.map(challenge => ({
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          category: challenge.category,
          calculationType: challenge.calculationType,
          savingsValue: challenge.savingsValue,
          targetQuestion: challenge.targetQuestion,
          overrideValue: challenge.overrideValue,
          completed: false
        }))
      });
      
      await challengeDoc.save();
    }
    
    // Add tracking status to the response
    challengeDoc.hasCompletedTracking = hasTracking;
    challengeDoc.trackingRequired = !hasTracking;

    return challengeDoc;
  }
  
  /**
   * Complete a specific challenge with daily tracking validation
   * @param {string} userId - User ID
   * @param {string} challengeId - Challenge ID to complete
   * @returns {Object} Updated challenge document and recalculation result
   */
  static async completeChallenge(userId, challengeId) {
    // Validate that user has completed daily tracking
    const hasTracking = await this.hasCompletedDailyTracking(userId);
    if (!hasTracking) {
      throw new Error('You must complete your daily tracking before attempting eco-challenges');
    }
    
    const challengeDoc = await this.getTodaysChallenges(userId);
    
    // Find the specific challenge
    const challenge = challengeDoc.dailyChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      throw new Error('Challenge not found');
    }
    
    if (challenge.completed) {
      throw new Error('Challenge already completed');
    }
    
    // Mark challenge as completed
    challenge.completed = true;
    challenge.completedAt = new Date();
    
    // Trigger recalculation if user has daily tracking data
    const recalculationResult = await this.recalculateWithChallenges(userId, challengeDoc);
    
    // Save the updated challenge document
    await challengeDoc.save();
    
    return {
      challengeDoc,
      recalculationResult,
      completedCount: challengeDoc.getCompletedCount(),
      allCompleted: challengeDoc.areAllCompleted()
    };
  }
  
  /**
   * Recalculation Engine - applies completed challenges to daily tracking
   * @param {string} userId - User ID
   * @param {Object} challengeDoc - Challenge document with completed challenges
   * @returns {Object} Recalculation result
   */
  static async recalculateWithChallenges(userId, challengeDoc) {
    // Get today's tracking data
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    const trackingEntry = await DailyTracking.findOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });
    
    if (!trackingEntry) {
      return { message: 'No tracking data found for today', recalculated: false };
    }
    
    // Store original footprint for comparison
    const originalFootprint = { ...trackingEntry.calculatedFootprint };
    
    // Create a working copy of the tracking data for recalculation
    const workingData = {
      transport: { ...trackingEntry.transport },
      homeEnergy: { ...trackingEntry.homeEnergy },
      food: { ...trackingEntry.food },
      flightType: trackingEntry.transport?.flightType || 'no_flight'
    };
    
    // Apply completed challenges
    const completedChallenges = challengeDoc.dailyChallenges.filter(c => c.completed);
    let totalSavings = 0;
    
    for (const challenge of completedChallenges) {
      if (challenge.calculationType === 'override') {
        // Apply override challenges - modify the working data
        this.applyChallengeOverride(workingData, challenge);
      } else if (challenge.calculationType === 'fixed_credit') {
        // Track fixed credit savings
        totalSavings += Number(challenge.savingsValue) || 0;
      }
    }
    
    // Recalculate footprint with modified data
    const recalculatedFootprint = DailyTrackingService.calculateDailyFootprint({
      transport: workingData.transport,
      flightType: workingData.flightType,
      homeType: workingData.homeEnergy?.homeType,
      occupants: workingData.homeEnergy?.occupants,
      appliances: workingData.homeEnergy?.appliances,
      breakfast: workingData.food?.breakfast,
      lunch: workingData.food?.lunch,
      dinner: workingData.food?.dinner
    });
    
    // Apply fixed credit savings
    recalculatedFootprint.total = Math.max(0, recalculatedFootprint.total - totalSavings);
    
    // Update the tracking entry
    trackingEntry.calculatedFootprint = recalculatedFootprint;
    challengeDoc.isRecalculated = true;
    
    // Add to calculation history
    challengeDoc.calculationHistory.push({
      timestamp: new Date(),
      footprint: recalculatedFootprint.total,
      source: 'challenge_completion',
      challengeId: completedChallenges[completedChallenges.length - 1]?.id
    });
    
    // Save both documents
    await trackingEntry.save();
    challengeDoc.dailyTrackingId = trackingEntry._id;
    
    return {
      recalculated: true,
      originalFootprint,
      newFootprint: recalculatedFootprint,
      savings: originalFootprint.total - recalculatedFootprint.total,
      appliedChallenges: completedChallenges.length
    };
  }
  
  /**
   * Apply challenge overrides to working data
   * @param {Object} workingData - Modifiable copy of tracking data
   * @param {Object} challenge - Challenge with override rules
   */
  static applyChallengeOverride(workingData, challenge) {
    const { targetQuestion, overrideValue } = challenge;
    
    switch (targetQuestion) {
      case 'Q1': // Transportation mode
        if (overrideValue === 'public_transport') {
          workingData.transport.modes = [{ id: 'public_transport', distance: 10 }];
        } else if (overrideValue === 'walking_5km') {
          workingData.transport.modes = [{ id: 'walking', distance: 5 }];
        } else if (overrideValue === 'no_commute') {
          workingData.transport.modes = [{ id: 'no_travel', distance: 0 }];
        }
        break;
        
      case 'Q2': // Flights
        if (overrideValue === 'no') {
          workingData.flightType = 'no_flight';
        }
        break;
        
      case 'Q4': // Home occupants
        if (overrideValue === '5_occupants') {
          workingData.homeEnergy.occupants = 5;
        }
        break;
        
      case 'Q5': // Appliances
        if (overrideValue === 'none' || overrideValue === 'no_ac_heater') {
          workingData.homeEnergy.appliances = ['none'];
        }
        break;
        
      case 'Q6,Q7,Q8': // All meals
        if (overrideValue === 'plant_based') {
          workingData.food.breakfast = 'plant';
          workingData.food.lunch = 'plant';
          workingData.food.dinner = 'plant';
        }
        break;
        
      case 'Q7': // Lunch only
        if (overrideValue === 'plant_based') {
          workingData.food.lunch = 'plant';
        }
        break;
    }
  }
  
  /**
   * Regenerate today's challenges for a user (for testing/development)
   * @param {string} userId - User ID
   * @returns {Object} New challenge document
   */
  static async regenerateTodaysChallenges(userId) {
    const now = new Date();
    const phOffset = 8 * 60 * 60 * 1000;
    const phNow = new Date(now.getTime() + phOffset);
    const today = new Date(Date.UTC(phNow.getFullYear(), phNow.getMonth(), phNow.getDate()));
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Delete existing challenge document for today
    await Challenge.deleteOne({
      userId: userId,
      date: { $gte: today, $lt: tomorrow }
    });

    // Generate new challenges
    return await this.getTodaysChallenges(userId);
  }

  /**
   * Get challenge statistics for a user
   * @param {string} userId - User ID
   * @param {number} days - Number of days to look back (default 7)
   * @returns {Object} Challenge statistics
   */
  static async getChallengeStats(userId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    const challengeDocs = await Challenge.find({
      userId: userId,
      date: { $gte: startDate }
    }).sort({ date: -1 });
    
    let totalChallenges = 0;
    let completedChallenges = 0;
    let perfectDays = 0;
    
    challengeDocs.forEach(doc => {
      totalChallenges += doc.dailyChallenges.length;
      completedChallenges += doc.getCompletedCount();
      if (doc.areAllCompleted()) perfectDays++;
    });
    
    return {
      period: `${days} days`,
      totalChallenges,
      completedChallenges,
      completionRate: totalChallenges > 0 ? Math.round((completedChallenges / totalChallenges) * 100) : 0,
      perfectDays,
      activeDays: challengeDocs.length
    };
  }
}

module.exports = ChallengeService;