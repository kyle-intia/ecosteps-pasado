// CO2 factors and computation logic as per specifications

const CO2_FACTORS = {
  transport: {
    'Personal Car': 0.00020,
    'Motorcycle': 0.00010,
    'Public Transport': 0.00005,
    'Walking/Biking/E-bike': 0,
    'Work from Home': 0
  },
  home: {
    'Large House': 4.5,
    'Small House': 3.5,
    'Apartment': 2.5
  },
  bill: {
    '<7500': 0.9,
    '7501-12000': 1.0,
    '12001-25000': 1.1,
    '>25000': 1.15
  },
  renewables: {
    true: 0.9,
    false: 1.0
  },
  diet: {
    'High Meat': 5.0,
    'Moderate Meat': 2.0,
    'Low Meat': 1.7,
    'Pescatarian': 1.4,
    'Vegan/Vegetarian': 1.2
  }
};

class CalculationService {
  /**
   * Calculate Section A: Transport and Travel
   * @param {Object} responses - User responses
   * @returns {number} Section A CO2 total
   */
  static calculateSectionA(responses) {
    const { Q1_modes, Q2_kmPerDay, Q3_flightsPerYear } = responses;
    
    // Calculate commute CO2 for each mode
    let commuteCO2 = 0;
    Q1_modes.forEach(mode => {
      const factor = CO2_FACTORS.transport[mode] || 0;
      commuteCO2 += Q2_kmPerDay * 365 * factor;
    });

    // Calculate flight CO2
    const flightCO2 = Q3_flightsPerYear * 0.8;

    return commuteCO2 + flightCO2;
  }

  /**
   * Calculate Section B: Home Energy
   * @param {Object} responses - User responses
   * @returns {number} Section B CO2 total
   */
  static calculateSectionB(responses) {
    const { Q4_homeType, Q5_residents, Q6_billRange, Q7_hasRenewables } = responses;
    
    // Base home CO2 per person
    const homeBase = CO2_FACTORS.home[Q4_homeType] || 0;
    const homeCO2_perPerson = homeBase / Q5_residents;

    // Adjust based on bill range
    const billAdjustment = CO2_FACTORS.bill[Q6_billRange] || 1.0;
    const adjustedHomeCO2 = homeCO2_perPerson * billAdjustment;

    // Adjust for renewables
    const renewableAdjustment = CO2_FACTORS.renewables[Q7_hasRenewables] || 1.0;
    const finalAdjustedHomeCO2 = adjustedHomeCO2 * renewableAdjustment;

    return finalAdjustedHomeCO2;
  }

  /**
   * Calculate Section C: Food and Diet
   * @param {Object} responses - User responses
   * @returns {number} Section C CO2 total
   */
  static calculateSectionC(responses) {
    const { Q8_dietType } = responses;
    return CO2_FACTORS.diet[Q8_dietType] || 0;
  }

  /**
   * Calculate all sections and total CO2
   * @param {Object} responses - User responses
   * @returns {Object} All calculated results
   */
  static calculateAll(responses) {
    const sectionA = this.calculateSectionA(responses);
    const sectionB = this.calculateSectionB(responses);
    const sectionC = this.calculateSectionC(responses);
    const totalCO2 = sectionA + sectionB + sectionC;

    return {
      sectionA: Math.round(sectionA * 100) / 100, // Round to 2 decimal places
      sectionB: Math.round(sectionB * 100) / 100,
      sectionC: Math.round(sectionC * 100) / 100,
      totalCO2: Math.round(totalCO2 * 100) / 100
    };
  }

  /**
   * Validate responses
   * @param {Object} responses - User responses
   * @returns {Object} Validation result
   */
  static validateResponses(responses) {
    const errors = [];

    // Validate Q1_modes
    if (!Array.isArray(responses.Q1_modes) || responses.Q1_modes.length === 0) {
      errors.push('Q1_modes must be a non-empty array');
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
    const validHomeTypes = ['Large House', 'Small House', 'Apartment'];
    if (!validHomeTypes.includes(responses.Q4_homeType)) {
      errors.push('Q4_homeType must be one of: Large House, Small House, Apartment');
    }

    // Validate Q5_residents
    if (typeof responses.Q5_residents !== 'number' || responses.Q5_residents < 1) {
      errors.push('Q5_residents must be a positive integer');
    }

    // Validate Q6_billRange
    const validBillRanges = ['<7500', '7501-12000', '12001-25000', '>25000'];
    if (!validBillRanges.includes(responses.Q6_billRange)) {
      errors.push('Q6_billRange must be one of the specified ranges');
    }

    // Validate Q7_hasRenewables
    if (typeof responses.Q7_hasRenewables !== 'boolean') {
      errors.push('Q7_hasRenewables must be a boolean');
    }

    // Validate Q8_dietType
    const validDietTypes = ['High Meat', 'Moderate Meat', 'Low Meat', 'Pescatarian', 'Vegan/Vegetarian'];
    if (!validDietTypes.includes(responses.Q8_dietType)) {
      errors.push('Q8_dietType must be one of the specified diet types');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = CalculationService;
