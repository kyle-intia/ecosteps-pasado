const EmissionFactorModel = require("../models/emissionFactorModel");

class EmissionFactorService {
  static async createEmissionFactor(data) {
    const factor = new EmissionFactorModel(data);
    return await factor.save();
  }

  static async getAllEmissionFactors() {
    return await EmissionFactorModel.find();
  }

  static async getEmissionFactorById(id) {
    return await EmissionFactorModel.findById(id);
  }

  static async updateEmissionFactor(id, data) {
    return await EmissionFactorModel.findByIdAndUpdate(id, data, { new: true });
  }

  static async deleteEmissionFactor(id) {
    return await EmissionFactorModel.findByIdAndDelete(id);
  }

  static async getFormattedFactors() {
    const allFactors = await EmissionFactorModel.find({}).lean();

    const CO2_FACTORS_DAILY = {
      transport: {},
      flights: {},
      homeEnergy: {},
      appliances: {},
      food: {},
    };

    allFactors.forEach((factor) => {
      const { category, type, value } = factor;

      if (CO2_FACTORS_DAILY.hasOwnProperty(category)) {
        CO2_FACTORS_DAILY[category][type] = value;
      }
    });

    return CO2_FACTORS_DAILY;
  }

  static async getFactors() {
    const factor = await EmissionFactorModel.find().lean();

    const CO2_FACTORS = {};

    factor.forEach(({ category, type, factor }) => {
      if (!CO2_FACTORS[category]) {
        CO2_FACTORS[category] = {};
      }
      CO2_FACTORS[category][type] = factor;
    });

    return CO2_FACTORS;
  }
}

module.exports = EmissionFactorService;
