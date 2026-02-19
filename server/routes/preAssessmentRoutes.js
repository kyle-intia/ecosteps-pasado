const express = require("express");
const router = express.Router();
const PreAssessment = require("../models/PreAssessment");
const CalculationService = require("../services/calculationService");
const authenticate = require("../middleware/authenticate");
const NotificationService = require("../services/notificationService");

router.use(authenticate);

router.post("/submit", async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.userId;
    const email = req.user.email;
    if (!responses) {
      return res.status(400).json({ error: "responses are required" });
    }

    const validation = CalculationService.validateResponses(responses);
    if (!validation.isValid) {
      return res.status(400).json({
        error: "Invalid responses",
        details: validation.errors,
      });
    }

    const results = CalculationService.calculateAll(responses);

    const preAssessment = new PreAssessment({
      userId,
      responses,
      results,
      assessmentDone: true,
    });
    await preAssessment.save();

    res.status(201).json({
      success: true,
      data: {
        id: preAssessment._id,
        results: preAssessment.results,
        createdAt: preAssessment.createdAt,
        assessmentDone: preAssessment.assessmentDone,
      },
    });
  } catch (error) {
    console.error("Error in pre-assessment submission:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        error: "Validation failed",
        details: Object.values(error.errors).map((err) => err.message),
      });
    }

    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    const preAssessments = await PreAssessment.find({ userId })
      .sort({ createdAt: -1 })
      .select("results createdAt");

    if (!preAssessments || preAssessments.length === 0) {
      return res
        .status(404)
        .json({ error: "No pre-assessment found for this user" });
    }

    res.json({
      success: true,
      data: {
        count: preAssessments.length,
        assessments: preAssessments.map((assessment) => ({
          id: assessment._id,
          results: assessment.results,
          createdAt: assessment.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching pre-assessment:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const userId = req.userId;

    const latestAssessment = await PreAssessment.findOne({ userId })
      .sort({ createdAt: -1 })
      .select("responses results createdAt");

    if (!latestAssessment) {
      return res
        .status(404)
        .json({ error: "No pre-assessment found for this user" });
    }

    res.json({
      success: true,
      data: {
        id: latestAssessment._id,
        responses: latestAssessment.responses,
        results: latestAssessment.results,
        createdAt: latestAssessment.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching latest pre-assessment:", error);
    res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
});

router.get("/user/status", async (req, res) => {
  try {
    const userId = req.userId;
    const preAssessment = await PreAssessment.findOne({ userId });

    if (!preAssessment) {
      return res.status(404).json({ error: "User Pre-assessment not found" });
    }

    res.status(200).json({
      assessmentDone: preAssessment.assessmentDone || false,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
