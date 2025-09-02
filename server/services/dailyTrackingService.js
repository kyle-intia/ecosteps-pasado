// File: server/services/dailyTrackingService.js

const CO2_FACTORS_DAILY = {
  // Transport factors (kg CO₂e per km)
  transport: {
    'car': 0.25,
    'public_transport': 0.08,
    'motorcycle': 0.11,
    'bicycle': 0,
    'walking': 0,
    'no_travel': 0
  },
  
  // Flight emissions (kg CO₂e per flight)
  flights: {
    'long_haul': 250,
    'short_haul': 150,
    'no_flight': 0
  },
  
  // Home energy (annual kg CO₂e)
  homeEnergy: {
    'large_house': 4500,
    'small_house': 3500,
    'apartment': 2500
  },
  
  // High-energy appliances (percentage increase)
  appliances: {
    'ac_heating': 25,
    'heating_only': 25,
    'laundry': 5,
    'none': 0
  },
  
  // Food emissions (kg CO₂e per meal)
  food: {
    'breakfast_meat': 4.0,
    'breakfast_fish': 2.5,
    'breakfast_dairy': 2.0,
    'breakfast_mixed': 3.0,
    'breakfast_plant': 1.0,
    'breakfast_skipped': 0,
    'lunch_meat': 4.0,
    'lunch_fish': 2.5,
    'lunch_dairy': 2.0,
    'lunch_mixed': 3.0,
    'lunch_plant': 1.0,
    'lunch_skipped': 0,
    'dinner_meat': 4.0,
    'dinner_fish': 2.5,
    'dinner_dairy': 2.0,
    'dinner_mixed': 3.0,
    'dinner_plant': 1.0,
    'dinner_skipped': 0
  }
};

class DailyTrackingService {
  /**
   * Calculate transport emissions
   * @param {Object} transportData - Transport mode selections and distances
   * @param {string} flightType - Flight type selection
   * @returns {number} Transport CO2 in kg
   */
  static calculateTransport(transportData, flightType) {
    let transportTotal = 0;
    
    // Calculate transport mode emissions
    if (transportData.modes && transportData.modes.length > 0) {
      transportData.modes.forEach(mode => {
        const distance = transportData.distances[mode.id] || 0;
        const factor = CO2_FACTORS_DAILY.transport[mode.id] || 0;
        transportTotal += distance * factor;
      });
    }
    
    // Add flight emissions
    const flightEmission = CO2_FACTORS_DAILY.flights[flightType] || 0;
    transportTotal += flightEmission;
    
    return transportTotal;
  }
  
  /**
   * Calculate home energy emissions
   * @param {string} homeType - Type of home
   * @param {number} occupants - Number of people sharing the home
   * @param {Array} appliances - Selected high-energy appliances
   * @returns {number} Home energy CO2 in kg per day
   */
  static calculateHomeEnergy(homeType, occupants, appliances) {
    // Get annual household footprint
    const annualHouseholdFootprint = CO2_FACTORS_DAILY.homeEnergy[homeType] || 0;
    
    // Calculate daily per-person base rate
    const dailyPerPersonBase = annualHouseholdFootprint / 365 / occupants;
    
    // Calculate appliance percentage increases
    let applianceIncrease = 0;
    if (appliances && appliances.length > 0) {
      appliances.forEach(appliance => {
        applianceIncrease += CO2_FACTORS_DAILY.appliances[appliance] || 0;
      });
    }
    
    // Apply percentage increase
    const dailyHomeEnergy = dailyPerPersonBase * (1 + (applianceIncrease / 100));
    
    return dailyHomeEnergy;
  }
  
  /**
   * Calculate food emissions
   * @param {string} breakfast - Breakfast type
   * @param {string} lunch - Lunch type
   * @param {string} dinner - Dinner type
   * @returns {number} Food CO2 in kg
   */
  static calculateFood(breakfast, lunch, dinner) {
    const breakfastEmission = CO2_FACTORS_DAILY.food[`breakfast_${breakfast}`] || 0;
    const lunchEmission = CO2_FACTORS_DAILY.food[`lunch_${lunch}`] || 0;
    const dinnerEmission = CO2_FACTORS_DAILY.food[`dinner_${dinner}`] || 0;
    
    return breakfastEmission + lunchEmission + dinnerEmission;
  }
  
  /**
   * Calculate total daily footprint
   * @param {Object} responses - User responses from daily tracking form
   * @returns {Object} Calculated results
   */
  static calculateDailyFootprint(responses) {
    const validation = this.validateDailyResponses(responses);
    if (!validation.isValid) {
      throw new Error(`Invalid responses: ${validation.errors.join(', ')}`);
    }
    
    // Calculate each section
    const transport = this.calculateTransport(
      responses.transport, 
      responses.flightType || 'no_flight'
    );
    
    const homeEnergy = this.calculateHomeEnergy(
      responses.homeType,
      responses.occupants,
      responses.appliances || []
    );
    
    const food = this.calculateFood(
      responses.breakfast || 'skipped',
      responses.lunch || 'skipped',
      responses.dinner || 'skipped'
    );
    
    const total = transport + homeEnergy + food;
    
    return {
      transport: Math.round(transport * 100) / 100, // Round to 2 decimal places
      homeEnergy: Math.round(homeEnergy * 100) / 100,
      food: Math.round(food * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  }
  
  /**
   * Validate daily tracking responses
   * @param {Object} responses - User responses
   * @returns {Object} Validation result
   */
  static validateDailyResponses(responses) {
    const errors = [];
    
    // Validate transport data structure
    if (responses.transport && responses.transport.modes) {
      responses.transport.modes.forEach(mode => {
        if (!Object.keys(CO2_FACTORS_DAILY.transport).includes(mode.id)) {
          errors.push(`Invalid transport mode: ${mode.id}`);
        }
      });
    }
    
    // Validate flight type
    if (responses.flightType && !Object.keys(CO2_FACTORS_DAILY.flights).includes(responses.flightType)) {
      errors.push('Invalid flight type');
    }
    
    // Validate home type
    if (responses.homeType && !Object.keys(CO2_FACTORS_DAILY.homeEnergy).includes(responses.homeType)) {
      errors.push('Invalid home type');
    }
    
    // Validate occupants
    if (responses.occupants && (typeof responses.occupants !== 'number' || responses.occupants < 1)) {
      errors.push('Occupants must be a number greater than 0');
    }
    
    // Validate appliances
    if (responses.appliances) {
      responses.appliances.forEach(appliance => {
        if (!Object.keys(CO2_FACTORS_DAILY.appliances).includes(appliance)) {
          errors.push(`Invalid appliance: ${appliance}`);
        }
      });
    }
    
    // Validate food choices
    const foodTypes = ['meat', 'fish', 'dairy', 'mixed', 'plant', 'skipped'];
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      if (responses[meal] && !foodTypes.includes(responses[meal])) {
        errors.push(`Invalid ${meal} type: ${responses[meal]}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DailyTrackingService;