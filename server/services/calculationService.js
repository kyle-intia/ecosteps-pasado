const CO2_FACTORS = {
  transport: {
    "Personal Car": 0.25,
    Motorcycle: 0.11,
    "Public Transport": 0.08,
    "Bicycle/E-bike": 0,
    Walking: 0,
    "Work from Home": 0,
  },
  flight: {
    perFlight: 200,
  },

  home: {
    "Large House": 4500,
    "Small House": 3500,
    Apartment: 2500,
  },
  bill: {
    "Below ₱7,500 / month": 0.9,
    "₱7,501 – ₱12,000 / month": 1.0,
    "₱12,001 – ₱25,000 / month": 1.15,
    "Above ₱25,000 / month": 1.25,
  },
  renewables: {
    true: 0.85,
    false: 1.0,
  },

  diet: {
    "High meat intake (more than 3 times a week)": 5000,
    "Moderate meat intake (2–3 times a week)": 3400,
    "Low meat intake (about once a week)": 1700,
    "Pescetarian (fish but no meat)": 1400,
    "Vegetarian or Vegan (no meat or fish)": 1200,
  },
};

class CalculationService {
  static calculateSectionA(responses) {
    const { Q1_primaryMode, Q2_kmPerDay, Q3_flightsPerYear } = responses;

    const modeFactor = CO2_FACTORS.transport[Q1_primaryMode] || 0;
    const annualCommuteCO2 = Q2_kmPerDay * 365 * modeFactor;

    const annualFlightCO2 = Q3_flightsPerYear * CO2_FACTORS.flight.perFlight;

    return annualCommuteCO2 + annualFlightCO2;
  }

  static calculateSectionB(responses) {
    const { Q4_homeType, Q5_residents, Q6_billRange, Q7_hasRenewables } =
      responses;

    const annualHouseholdFootprint = CO2_FACTORS.home[Q4_homeType] || 0;

    const userShare = annualHouseholdFootprint / Q5_residents;

    const billMultiplier = CO2_FACTORS.bill[Q6_billRange] || 1.0;
    const afterBillAdjustment = userShare * billMultiplier;

    const renewableMultiplier = CO2_FACTORS.renewables[Q7_hasRenewables] || 1.0;
    const finalHomeCO2 = afterBillAdjustment * renewableMultiplier;

    return finalHomeCO2;
  }

  static calculateSectionC(responses) {
    const { Q8_dietType } = responses;
    return CO2_FACTORS.diet[Q8_dietType] || 0;
  }

  static calculateAll(responses) {
    const validation = this.validateResponses(responses);
    if (!validation.isValid) {
      throw new Error(`Invalid responses: ${validation.errors.join(", ")}`);
    }

    const sectionA = this.calculateSectionA(responses);
    const sectionB = this.calculateSectionB(responses);
    const sectionC = this.calculateSectionC(responses);
    const totalCO2 = sectionA + sectionB + sectionC;

    return {
      sectionA: Math.round(sectionA),
      sectionB: Math.round(sectionB),
      sectionC: Math.round(sectionC),
      totalCO2: Math.round(totalCO2),
    };
  }

  static validateResponses(responses) {
    const errors = [];

    const validTransportModes = Object.keys(CO2_FACTORS.transport);
    if (!validTransportModes.includes(responses.Q1_primaryMode)) {
      errors.push("Q1_primaryMode must be a valid transport mode");
    }

    if (
      typeof responses.Q2_kmPerDay !== "number" ||
      responses.Q2_kmPerDay < 0
    ) {
      errors.push("Q2_kmPerDay must be a non-negative number");
    }

    if (
      typeof responses.Q3_flightsPerYear !== "number" ||
      responses.Q3_flightsPerYear < 0
    ) {
      errors.push("Q3_flightsPerYear must be a non-negative number");
    }

    const validHomeTypes = Object.keys(CO2_FACTORS.home);
    if (!validHomeTypes.includes(responses.Q4_homeType)) {
      errors.push("Q4_homeType must be one of: " + validHomeTypes.join(", "));
    }

    if (
      typeof responses.Q5_residents !== "number" ||
      responses.Q5_residents < 1
    ) {
      errors.push("Q5_residents must be a number greater than 0");
    }

    const validBillRanges = Object.keys(CO2_FACTORS.bill);
    if (!validBillRanges.includes(responses.Q6_billRange)) {
      errors.push("Q6_billRange must be one of: " + validBillRanges.join(", "));
    }

    if (typeof responses.Q7_hasRenewables !== "boolean") {
      errors.push("Q7_hasRenewables must be a boolean (true/false)");
    }

    const validDietTypes = Object.keys(CO2_FACTORS.diet);
    if (!validDietTypes.includes(responses.Q8_dietType)) {
      errors.push("Q8_dietType must be one of: " + validDietTypes.join(", "));
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = CalculationService;
