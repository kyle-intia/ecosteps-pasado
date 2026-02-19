const badgeAchievementModel = require("../models/badgeAchivementModel");
const Achievement = require("../models/Achievement");

async function updateAchievementConditions() {
  try {
    const carbonConscious = await badgeAchievementModel.findOne({
      name: "Carbon Conscious",
    });
    if (carbonConscious) {
      await badgeAchievementModel.findByIdAndUpdate(carbonConscious._id, {
        unlockCondition:
          "context.submitted === true && context.dailyFootprint < 10",
      });
      await Achievement.findOneAndUpdate(
        { achievementId: carbonConscious.achievementId },
        {
          unlockCondition:
            "context.submitted === true && context.dailyFootprint < 10",
        },
      );
      console.log("Updated unlockCondition for Carbon Conscious");
    } else {
      console.log("Carbon Conscious achievement not found");
    }

    const zeroHero = await badgeAchievementModel.findOne({ name: "Zero Hero" });
    if (zeroHero) {
      await badgeAchievementModel.findByIdAndUpdate(zeroHero._id, {
        unlockCondition:
          "context.submitted === true && context.dailyFootprint < 5",
      });
      await Achievement.findOneAndUpdate(
        { achievementId: zeroHero.achievementId },
        {
          unlockCondition:
            "context.submitted === true && context.dailyFootprint < 5",
        },
      );
      console.log("Updated unlockCondition for Zero Hero");
    } else {
      console.log("Zero Hero achievement not found");
    }

    console.log("Achievement condition updates completed");
  } catch (error) {
    console.error("Error updating achievement conditions:", error);
    throw error;
  }
}

module.exports = updateAchievementConditions;
