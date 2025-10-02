let CO2_FACTORS_DAILY = null;

class DailyTrackingService {

  static init(factors) {
    CO2_FACTORS_DAILY = factors;
  }

  /**
   * Calculate transport emissions
   * @param {Object} transportData - Transport mode selections and distances
   * @param {string} flightType - Flight type selection
   * @returns {number} Transport CO2 in kg
   */
  static calculateTransport(transportData, flightType) {

    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    let transportTotal = 0;

    const safeTransport = transportData || {};
    const modes = Array.isArray(safeTransport.modes) ? safeTransport.modes : [];
    const distances = typeof safeTransport.distances === 'object' && safeTransport.distances !== null
      ? safeTransport.distances
      : {};

    // Calculate transport mode emissions
    if (modes.length > 0) {
      modes.forEach(mode => {
        const modeId = typeof mode === 'string' ? mode : mode.id;
        const distanceFromMap = Number(distances[modeId]) || 0;
        const distanceFromMode = typeof mode === 'object' && mode && typeof mode.distance !== 'undefined'
          ? Number(mode.distance) || 0
          : 0;
        const distance = Math.max(distanceFromMap, distanceFromMode);
        const factor = CO2_FACTORS_DAILY.transport[modeId] || 0;
        transportTotal += distance * factor;
      });
    }

    // Add flight emissions
    const normalizedFlight = (() => {
      const v = (flightType || '').replace('-', '_');
      if (v === 'none') return 'no_flight';
      return v;
    })();
    const flightEmission = CO2_FACTORS_DAILY.flights[normalizedFlight] || 0;
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

    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    const normalizedHomeType = (homeType || '').replace('-', '_');
    const annualHouseholdFootprint = CO2_FACTORS_DAILY.homeEnergy[normalizedHomeType] || 0;

    const numOccupants = Math.max(1, Number(occupants) || 1);
    const dailyPerPersonBase = annualHouseholdFootprint / 365 / numOccupants;

    let applianceIncrease = 0;
    const list = Array.isArray(appliances) ? appliances : [];
    list.forEach(appliance => {
      const key = (appliance || '').replace('-', '_');
      applianceIncrease += CO2_FACTORS_DAILY.appliances[key] || 0;
    });

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

    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

    const normalize = (value) => {
      const v = (value || '').replace('-', '_');
      if (v === 'none') return 'skipped';
      if (v === 'plant_based') return 'plant';
      return v;
    };
    const breakfastEmission = CO2_FACTORS_DAILY.food[`breakfast_${normalize(breakfast)}`] || 0;
    const lunchEmission = CO2_FACTORS_DAILY.food[`lunch_${normalize(lunch)}`] || 0;
    const dinnerEmission = CO2_FACTORS_DAILY.food[`dinner_${normalize(dinner)}`] || 0;
    
    return breakfastEmission + lunchEmission + dinnerEmission;
  }
  
  /**
   * Calculate total daily footprint
   * @param {Object} responses - User responses from daily tracking form
   * @returns {Object} Calculated results
   */
  static calculateDailyFootprint(responses) {

    if (!CO2_FACTORS_DAILY) {
      throw new Error("CO2 factors not initialized");
    }

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
 
  
  static validateDailyResponses(responses) {
    
    const errors = [];
    const safe = responses || {};

    // Validate transport data structure
    if (safe.transport && Array.isArray(safe.transport.modes)) {
      safe.transport.modes.forEach(mode => {
        const modeId = typeof mode === 'string' ? mode : mode.id;
        if (!Object.prototype.hasOwnProperty.call(CO2_FACTORS_DAILY.transport, modeId)) {
          errors.push(`Invalid transport mode: ${modeId}`);
        }
      });
    }
    
    // Validate flight type (accept variants: long-haul/short-haul/none)
    if (safe.flightType) {
      const normalizedFlight = (() => {
        const v = String(safe.flightType).replace('-', '_');
        if (v === 'none') return 'no_flight';
        return v;
      })();
      if (!Object.prototype.hasOwnProperty.call(CO2_FACTORS_DAILY.flights, normalizedFlight)) {
        errors.push('Invalid flight type');
      }
    }
    
    // Validate home type
    if (safe.homeType) {
      const normalizedHomeType = safe.homeType.replace('-', '_');
      if (!Object.prototype.hasOwnProperty.call(CO2_FACTORS_DAILY.homeEnergy, normalizedHomeType)) {
        errors.push('Invalid home type');
      }
    }
    
    // Validate occupants
    if (safe.occupants && (isNaN(Number(safe.occupants)) || Number(safe.occupants) < 1)) {
      errors.push('Occupants must be a number greater than 0');
    }
    
    // Validate appliances
    if (safe.appliances && Array.isArray(safe.appliances)) {
      safe.appliances.forEach(appliance => {
        let key = (appliance || '').replace('-', '_');
        if (key === 'aircon') key = 'ac_heating';
        if (!Object.prototype.hasOwnProperty.call(CO2_FACTORS_DAILY.appliances, key)) {
          errors.push(`Invalid appliance: ${appliance}`);
        }
      });
    }
    
    // Validate food choices
    const foodTypes = ['meat', 'fish', 'dairy', 'mixed', 'plant', 'skipped'];
    ['breakfast', 'lunch', 'dinner'].forEach(meal => {
      if (safe[meal]) {
        const normalized = safe[meal].replace('-', '_');
        const mapped = normalized === 'none' ? 'skipped' : (normalized === 'plant_based' ? 'plant' : normalized);
        if (!foodTypes.includes(mapped)) {
          errors.push(`Invalid ${meal} type: ${safe[meal]}`);
        }
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = DailyTrackingService;