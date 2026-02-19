const express = require("express");
const router = express.Router();
const AssessmentModel = require("../models/AssessmentModel");
const {
  saveAssessment,
  getImprovementResult,
} = require("../services/AssessmentService");

router.post("/", async (req, res) => {
  try {
    const assessment = await saveAssessment(req.body);
    res.status(201).json({ success: true, assessment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/result/:userId", async (req, res) => {
  try {
    const result = await getImprovementResult(req.params.userId);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.get("/user/:userId", async (req, res) => {
  try {
    const assessments = await AssessmentModel.find({
      userId: req.params.userId,
    }).sort({ createdAt: -1 });

    res.json({ success: true, assessments });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
