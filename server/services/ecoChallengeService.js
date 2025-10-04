const EcoChallenge = require('../models/ecoChallengeModel');

class EcoChallengeService {
  // Create a new eco challenge
  static async createChallenge(data) {
    try {
      const existing = await EcoChallenge.findOne({ id: data.id });
      if (existing) throw new Error('Challenge with this ID already exists');

      const challenge = new EcoChallenge(data);
      await challenge.save();
      return challenge;
    } catch (error) {
      throw new Error(`Failed to create challenge: ${error.message}`);
    }
  }

  // Get all challenges
  static async getAllChallenges() {
    try {
      return await EcoChallenge.find({});
    } catch (error) {
      throw new Error('Failed to fetch challenges');
    }
  }

  // Get challenge by ID
  static async getChallengeById(id) {
    try {
      const challenge = await EcoChallenge.findOne({ id });
      if (!challenge) throw new Error('Challenge not found');
      return challenge;
    } catch (error) {
      throw new Error('Failed to fetch challenge');
    }
  }

  // Update challenge
  static async updateChallenge(id, data) {
    try {
      const { _id, ...updateData } = data;
      const updated = await EcoChallenge.findOneAndUpdate({ id }, updateData, { new: true });
      if (!updated) throw new Error('Challenge not found');
      return updated;
    } catch (error) {
      throw new Error(`Failed to update challenge: ${error.message}`);
    }
  }

  // Delete challenge
  static async deleteChallenge(id) {
    try {
      const deleted = await EcoChallenge.findOneAndDelete({ id });
      if (!deleted) throw new Error('Challenge not found');
      return deleted;
    } catch (error) {
      throw new Error(`Failed to delete challenge: ${error.message}`);
    }
  }
}

module.exports = EcoChallengeService;
