const express = require('express');
const router = express.Router();
const PreAssessment = require('../models/PreAssessment');
const CalculationService = require('../services/calculationService');

/**
 * POST /api/preassessment/submit
 * Accepts user responses Q1–Q8, runs backend computation, saves inputs + results to MongoDB, and returns computed totals.
 */
router.post('/submit', async (req, res) => {
  try {
    const { userId, responses } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        error: 'userId is required' 
      });
    }

    if (!responses) {
      return res.status(400).json({ 
        error: 'responses are required' 
      });
    }

    // Validate responses structure
    const validation = CalculationService.validateResponses(responses);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Invalid responses',
        details: validation.errors 
      });
    }

    // Calculate results
    const results = CalculationService.calculateAll(responses);

    // Create new pre-assessment
    const preAssessment = new PreAssessment({
      userId,
      responses,
      results
    });

    // Save to database
    await preAssessment.save();

    // Return the saved document with results
    res.status(201).json({
      success: true,
      data: {
        id: preAssessment._id,
        results: preAssessment.results,
        createdAt: preAssessment.createdAt
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
 * Fetches stored pre-assessment results (section totals + overall total) for display in the dashboard.
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid userId format' 
      });
    }

    // Find all pre-assessments for the user, sorted by newest first
    const preAssessments = await PreAssessment.find({ userId })
      .sort({ createdAt: -1 })
      .select('results createdAt');

    if (!preAssessments || preAssessments.length === 0) {
      return res.status(404).json({ 
        error: 'No pre-assessment found for this user' 
      });
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
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * GET /api/preassessment/:userId/latest
 * Fetches the latest pre-assessment for a user
 */
router.get('/:userId/latest', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ 
        error: 'Invalid userId format' 
      });
    }

    const latestAssessment = await PreAssessment.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('responses results createdAt');

    if (!latestAssessment) {
      return res.status(404).json({ 
        error: 'No pre-assessment found for this user' 
      });
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
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
