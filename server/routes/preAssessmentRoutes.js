const express = require('express');
const router = express.Router();
const PreAssessment = require('../models/PreAssessment');
const CalculationService = require('../services/calculationService');
const authenticate = require('../middleware/authenticate');

/**
 * POST /api/preassessment/submit
 * Accepts user responses Q1–Q8, runs backend computation, saves inputs + results to MongoDB, and returns computed totals.
 */
router.use(authenticate);

router.post('/submit', async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.userId;
    if (!responses) {
      return res.status(400).json({ error: 'responses are required' });
    }

    // ✅ Validate responses structure using the service
    const validation = CalculationService.validateResponses(responses);
    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid responses',
        details: validation.errors
      });
    }

    // ✅ Calculate results
    const results = CalculationService.calculateAll(responses);

    // Create and save new pre-assessment
    const preAssessment = new PreAssessment({ userId, responses, results, assessmentDone: true });
    await preAssessment.save();

    // ✅ Explicitly select data to return (Best Practice)
    res.status(201).json({
      success: true,
      data: {
        id: preAssessment._id,
        results: preAssessment.results,
        createdAt: preAssessment.createdAt,
        assessmentDone: preAssessment.assessmentDone
      }
    });

  } catch (error) {
    console.error('Error in pre-assessment submission:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation failed',
        details: Object.values(error.errors).map(err => err.message)
      });
    }

    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/preassessment/:userId
 * Fetches stored pre-assessment results for a user.
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    // ❌ REMOVED: The ObjectId validation check.
    // The find query will work with any string ID and just return an empty array if none exist.

    // Find all pre-assessments for the user, sorted by newest first
    const preAssessments = await PreAssessment.find({ userId })
      .sort({ createdAt: -1 })
      .select('results createdAt'); // ✅ Good, selecting only necessary fields

    if (!preAssessments || preAssessments.length === 0) {
      return res.status(404).json({ error: 'No pre-assessment found for this user' });
    }

    res.json({
      success: true,
      data: {
        count: preAssessments.length,
        assessments: preAssessments.map(assessment => ({
          id: assessment._id,
          results: assessment.results,
          createdAt: assessment.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching pre-assessment:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/preassessment/:userId/latest
 * Fetches the latest pre-assessment for a user, including their original responses.
 */
router.get('/latest', async (req, res) => {
  try {
    const userId = req.userId;

    // ❌ REMOVED: The ObjectId validation check.

    const latestAssessment = await PreAssessment.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('responses results createdAt'); // ✅ Good

    if (!latestAssessment) {
      return res.status(404).json({ error: 'No pre-assessment found for this user' });
    }

    res.json({
      success: true,
      data: {
        id: latestAssessment._id,
        responses: latestAssessment.responses,
        results: latestAssessment.results,
        createdAt: latestAssessment.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching latest pre-assessment:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});



router.get('/user/status', async (req, res) => {
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