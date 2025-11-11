const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/authenticate");
const activityController = require("../controllers/activity.controller");

// POST /api/activities/submit - add entry
router.post("/submit", authenticate, activityController.addActivity);

// GET /api/activities/fetch/today - only today's entries
router.get("/fetch/today", authenticate, activityController.getTodayActivities);

// PUT /api/activities/:id - update full activity
router.put("/update/:id", authenticate, activityController.updateActivity);

// PATCH /api/activities/:id - partially update activity
router.patch("/patch/:id", authenticate, activityController.patchActivity);

// DELETE /api/activities/:id - delete activity
router.post("/delete/:id", authenticate, activityController.deleteActivity);

module.exports = router;
