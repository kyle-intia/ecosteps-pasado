const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const activityController = require("../controllers/activity.controller");

router.post("/submit", authenticate, activityController.addActivity);

router.get("/fetch/today", authenticate, activityController.getTodayActivities);

router.put("/update/:id", authenticate, activityController.updateActivity);

router.patch("/patch/:id", authenticate, activityController.patchActivity);

router.post("/delete/:id", authenticate, activityController.deleteActivity);

module.exports = router;
