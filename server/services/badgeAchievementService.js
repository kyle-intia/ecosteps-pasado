const badgeAchievementModel = require("../models/badgeAchivementModel");
const Achievement = require("../models/Achievement");

class badgeAchievementService {
  static async createAchievement(data) {
    try {
      const existing = await badgeAchievementModel.findOne({
        id: data.achievementId,
      });
      if (existing) throw new Error("Achievement with this ID already exists");

      const achievement = new badgeAchievementModel(data);
      await achievement.save();
      return achievement;
    } catch (error) {
      throw new Error("Failed to create achievement");
    }
  }

  static async getAllAchievements() {
    try {
      const achievements = await badgeAchievementModel.find();
      return achievements;
    } catch (error) {
      throw new Error("Failed to fetch achievements");
    }
  }

  static async getAchievementById(id) {
    try {
      const achievement = await badgeAchievementModel.findById(id);
      if (!achievement) {
        throw new Error("Achievement not found");
      }
      return achievement;
    } catch (error) {
      throw new Error("Failed to fetch achievement");
    }
  }

  static async updateAchievement(id, data) {
    try {
      const { _id, achievementId, ...updateData } = data;

      const updatedBadgeAchievement =
        await badgeAchievementModel.findByIdAndUpdate(id, updateData, {
          new: true,
        });

      const updatedAchievement = await Achievement.findOneAndUpdate(
        { achievementId: id },
        updateData,
        { new: true },
      );

      if (!updatedBadgeAchievement || !updatedAchievement) {
        throw new Error("Failed to update achievement or badge");
      }

      return {
        badgeAchievement: updatedBadgeAchievement,
        achievement: updatedAchievement,
      };
    } catch (error) {
      console.error("Error updating achievement and badge:", error);
      throw new Error(
        `Failed to update achievement and badge: ${error.message}`,
      );
    }
  }

  static async deleteAchievement(id) {
    try {
      const deletedBadgeAchievement =
        await badgeAchievementModel.findByIdAndDelete(id);

      const deletedAchievement = await Achievement.findOneAndDelete({
        achievementId: id,
      });

      if (!deletedBadgeAchievement && !deletedAchievement) {
        throw new Error("Achievement not found in either collection");
      }

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
