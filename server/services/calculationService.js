// CO2 factors and computation logic as per specifications
// All annual values are in kg CO₂e

const CO2_FACTORS = {
  // Section A: Transport
  transport: {
    // Emission factors in kg CO₂e per km
    'Personal Car': 0.25,
    'Motorcycle': 0.11,
    'Public Transport': 0.08,
    'Bicycle/E-bike': 0,
    'Walking': 0,
    'Work from Home': 0
  },
  flight: {
    // Average emission per flight in kg CO₂e
    perFlight: 200
  },

  // Section B: Home
  home: {
    // Annual household footprint in kg CO₂e
    'Large House': 4500,
    'Small House': 3500,
    'Apartment': 2500
  },
  bill: {
    // Multipliers for electricity bill adjustment
    'Below ₱7,500 / month': 0.9,   // -10%
    '₱7,501 – ₱12,000 / month': 1.0, // +0%
    '₱12,001 – ₱25,000 / month': 1.15, // +15%
    'Above ₱25,000 / month': 1.25   // +25%
  },
  renewables: {
    // Multiplier for renewable energy adjustment
    true: 0.85, // -15%
    false: 1.0  // No change
  },

  // Section C: Food
  diet: {
    // Annual diet footprint in kg CO₂e
    'High meat intake (more than 3 times a week)': 5000,
    'Moderate meat intake (2–3 times a week)': 3400,
    'Low meat intake (about once a week)': 1700,
    'Pescetarian (fish but no meat)': 1400,
    'Vegetarian or Vegan (no meat or fish)': 1200
  }
};

class CalculationService {
  /**
   * Calculate Section A: Transport and Travel
   * @param {Object} responses - User responses
   * @returns {number} Section A CO2 total in kg
   */
  static calculateSectionA(responses) {
    const { Q1_primaryMode, Q2_kmPerDay, Q3_flightsPerYear } = responses;
    
    // 1. Calculate annual commute emissions from primary mode
    const modeFactor = CO2_FACTORS.transport[Q1_primaryMode] || 0;
    const annualCommuteCO2 = Q2_kmPerDay * 365 * modeFactor;

    // 2. Calculate annual flight emissions
    const annualFlightCO2 = Q3_flightsPerYear * CO2_FACTORS.flight.perFlight;

    return annualCommuteCO2 + annualFlightCO2;
  }

  /**
   * Calculate Section B: Home Energy
   * @param {Object} responses - User responses
   * @returns {number} Section B CO2 total in kg
   */
  static calculateSectionB(responses) {
    const { Q4_homeType, Q5_residents, Q6_billRange, Q7_hasRenewables } = responses;
    
    // 1. Get the annual household footprint for the home type
    const annualHouseholdFootprint = CO2_FACTORS.home[Q4_homeType] || 0;

    // 2. Calculate the user's share based on number of residents
    const userShare = annualHouseholdFootprint / Q5_residents;

    // 3. Adjust based on electricity bill (the bill range key must match exactly)
    const billMultiplier = CO2_FACTORS.bill[Q6_billRange] || 1.0;
    const afterBillAdjustment = userShare * billMultiplier;

    // 4. Adjust for renewables
    const renewableMultiplier = CO2_FACTORS.renewables[Q7_hasRenewables] || 1.0;
    const finalHomeCO2 = afterBillAdjustment * renewableMultiplier;

    return finalHomeCO2;
  }

  /**
   * Calculate Section C: Food and Diet
   * @param {Object} responses - User responses
   * @returns {number} Section C CO2 total in kg
   */
  static calculateSectionC(responses) {
    const { Q8_dietType } = responses;
    // Directly return the annual value for the selected diet
    return CO2_FACTORS.diet[Q8_dietType] || 0;
  }

  /**
   * Calculate all sections and total CO2
   * @param {Object} responses - User responses
   * @returns {Object} All calculated results in kg, rounded
   */
  static calculateAll(responses) {
    const validation = this.validateResponses(responses);
    if (!validation.isValid) {
      throw new Error(`Invalid responses: ${validation.errors.join(', ')}`);
    }

    const sectionA = this.calculateSectionA(responses);
    const sectionB = this.calculateSectionB(responses);
    const sectionC = this.calculateSectionC(responses);
    const totalCO2 = sectionA + sectionB + sectionC;

    return {
      sectionA: Math.round(sectionA),
      sectionB: Math.round(sectionB),
      sectionC: Math.round(sectionC),
      totalCO2: Math.round(totalCO2)
    };
  }

  /**
   * Validate responses
   * @param {Object} responses - User responses
   * @returns {Object} Validation result
   */
  static validateResponses(responses) {
    const errors = [];

    // Validate Q1_primaryMode (now a single string)
    const validTransportModes = Object.keys(CO2_FACTORS.transport);
    if (!validTransportModes.includes(responses.Q1_primaryMode)) {
      errors.push('Q1_primaryMode must be a valid transport mode');
    }

    // Validate Q2_kmPerDay
    if (typeof responses.Q2_kmPerDay !== 'number' || responses.Q2_kmPerDay < 0) {
      errors.push('Q2_kmPerDay must be a non-negative number');
    }

    // Validate Q3_flightsPerYear
    if (typeof responses.Q3_flightsPerYear !== 'number' || responses.Q3_flightsPerYear < 0) {
      errors.push('Q3_flightsPerYear must be a non-negative number');
    }

    // Validate Q4_homeType
    const validHomeTypes = Object.keys(CO2_FACTORS.home);
    if (!validHomeTypes.includes(responses.Q4_homeType)) {
      errors.push('Q4_homeType must be one of: ' + validHomeTypes.join(', '));
    }

    // Validate Q5_residents
    if (typeof responses.Q5_residents !== 'number' || responses.Q5_residents < 1) {
      errors.push('Q5_residents must be a number greater than 0');
    }

    // Validate Q6_billRange (keys must match the dropdown options exactly)
    const validBillRanges = Object.keys(CO2_FACTORS.bill);
    if (!validBillRanges.includes(responses.Q6_billRange)) {
      errors.push('Q6_billRange must be one of: ' + validBillRanges.join(', '));
    }

    // Validate Q7_hasRenewables
    if (typeof responses.Q7_hasRenewables !== 'boolean') {
      errors.push('Q7_hasRenewables must be a boolean (true/false)');
    }

    // Validate Q8_dietType
    const validDietTypes = Object.keys(CO2_FACTORS.diet);
    if (!validDietTypes.includes(responses.Q8_dietType)) {
      errors.push('Q8_dietType must be one of: ' + validDietTypes.join(', '));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CalculationService;
