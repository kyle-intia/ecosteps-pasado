const badgeAchievementModel = require('../models/badgeAchivementModel');
const Achievement = require('../models/Achievement');

class badgeAchievementService {

  static async createAchievement(data) {
    try {
      const existing = await badgeAchievementModel.findOne({ id: data.achievementId });
      if (existing) throw new Error('Achievement with this ID already exists');
  
      const achievement = new badgeAchievementModel(data);
      await achievement.save();
      return achievement;
    } catch (error) {
      throw new Error('Failed to create achievement');
    }
  }

  static async getAllAchievements() {
    try {
      const achievements = await badgeAchievementModel.find();
      return achievements;
    } catch (error) {
      throw new Error('Failed to fetch achievements');
    }
  }

  static async getAchievementById(id) {
    try {
      const achievement = await badgeAchievementModel.findById(id);
      if (!achievement) {
        throw new Error('Achievement not found');
      }
      return achievement;
    } catch (error) {
      throw new Error('Failed to fetch achievement');
    }
  }

  static async updateAchievement(id, data) {
    try {
      // Ensure the _id and achievementId fields are not part of the update data
      const { _id, achievementId, ...updateData } = data;
  
      // Update the badge document
      const updatedBadgeAchievement = await badgeAchievementModel.findByIdAndUpdate(id, updateData, { new: true });
  
      // Update the achievement document, excluding `achievementId` from the update
      const updatedAchievement = await Achievement.findOneAndUpdate(
        { achievementId: id }, // Keep the original `achievementId` reference for the query
        updateData,             // Only update fields other than `achievementId`
        { new: true }
      );
  
      // Check if both updates succeeded
      if (!updatedBadgeAchievement || !updatedAchievement) {
        throw new Error('Failed to update achievement or badge');
      }
  
      return {
        badgeAchievement: updatedBadgeAchievement,
        achievement: updatedAchievement,
      };
    } catch (error) {
      console.error('Error updating achievement and badge:', error);
      throw new Error(`Failed to update achievement and badge: ${error.message}`);
    }
  }

    // Delete an achievement by ID
  static async deleteAchievement(id) {
    try {
      // Delete from badgeAchievementModel
      const deletedBadgeAchievement = await badgeAchievementModel.findByIdAndDelete(id);
  
      // Delete from Achievement collection based on achievementId
      const deletedAchievement = await Achievement.findOneAndDelete({ achievementId: id });
  
      // If both deletions fail, throw an error
      if (!deletedBadgeAchievement && !deletedAchievement) {
        throw new Error("Achievement not found in either collection");
      }
  
      // Return the deleted data
      return {
        badgeAchievement: deletedBadgeAchievement,
        achievement: deletedAchievement,
      };
    } catch (error) {
      throw new Error(`Failed to delete achievement: ${error.message}`);
    }
  }
  

}

module.exports = badgeAchievementService;
