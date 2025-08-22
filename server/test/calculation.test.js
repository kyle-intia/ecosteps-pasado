const CalculationService = require('../services/calculationService');

describe('CalculationService Tests', () => {
  const testResponses = {
    Q1_modes: ['Personal Car', 'Public Transport'],
    Q2_kmPerDay: 15,
    Q3_flightsPerYear: 2,
    Q4_homeType: 'Apartment',
    Q5_residents: 2,
    Q6_billRange: '7501-12000',
    Q7_hasRenewables: true,
    Q8_dietType: 'Moderate Meat'
  };

  test('Validation should pass', () => {
    const validation = CalculationService.validateResponses(testResponses);
    expect(validation.isValid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  test('Calculations should return correct total CO2', () => {
    const results = CalculationService.calculateAll(testResponses);
    expect(results.totalCO2).toBeCloseTo(6.09, 2);
    expect(results.sectionA).toBeCloseTo(2.97, 2);
    expect(results.sectionB).toBeCloseTo(1.13, 2);
    expect(results.sectionC).toBeCloseTo(2, 2);
  });
});

