const express = require("express");
const ActivityService = require("../services/ActivityService");
const authenticate = require("../middleware/authenticate");

const router = express.Router();

router.use(authenticate);

// Create new activity
router.post("/", async (req, res) => {
  try {
    const { category, subtype, points, totalDistance, duration } = req.body;
    const activity = await ActivityService.createActivity({
      userId: req.userId,
      category,
      subtype,
      points,
      totalDistance,
      duration,
    });
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get("/", async (req, res) => {
  try {
    const { category, subType } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (subType) filter.subType = subType;
    const activities = await ActivityService.getUserActivities(req.userId, filter);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedActivity = await ActivityService.updateActivity(id, updates);
    if (!updatedActivity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    res.json(updatedActivity);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
