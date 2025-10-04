const express = require('express');
const badgeAchievementService = require('../services/badgeAchievementService');
const router = express.Router();

// Route to fetch all achievements
router.get("/", async (req, res) => {
  try {
    const achievements = await badgeAchievementService.getAllAchievements();
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to fetch a specific achievement by ID
router.get("/:id", async (req, res) => {
  try {
    const achievement = await badgeAchievementService.getAchievementById(req.params.id);
    res.json(achievement);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

// Route to create a new achievement
router.post("/create", async (req, res) => {
  try {
    const newAchievement = await badgeAchievementService.createAchievement(req.body);
    res.status(201).json(newAchievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to update an achievement by ID
router.patch("/:id", async (req, res) => {
  try {
    const updatedAchievement = await badgeAchievementService.updateAchievement(req.params.id, req.body);
    res.json(updatedAchievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Route to delete an achievement by ID
router.delete("/:id", async (req, res) => {
  try {
    const deletedAchievement = await badgeAchievementService.deleteAchievement(req.params.id);
    res.json(deletedAchievement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
