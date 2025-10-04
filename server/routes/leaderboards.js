const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/Leaderboards');

// @route   GET /api/leaderboard?tier=gold|silver|bronze
// @desc    Get users for leaderboard with optional tier filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { tier } = req.query;
    let scoreFilter = {};

    // Define tier score ranges
    if (tier === 'gold') {
      scoreFilter = { score: { $gte: 8000, $lte: 10000 } };
    } else if (tier === 'silver') {
      scoreFilter = { score: { $gte: 5000, $lte: 7999 } };
    } else if (tier === 'bronze') {
      scoreFilter = { score: { $gte: 2000, $lte: 4999 } };
    }
    // If no tier specified or "overall", show all users

    const users = await User.find(scoreFilter).sort({ 
      score: -1,    // Primary sort: highest score 
      activity: -1, // Secondary sort: highest activity 
      posts: -1     // Tertiary sort: most posts
    }).limit(10); // Increased limit to show more users per tier

    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/leaderboard/rank/:userId
// @desc    Get a user's rank
// @access  Public // In a real app, this should be a private route
router.get('/rank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate if the userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // If user has no score, they are unranked
    if (user.score === 0) {
      return res.json({ rank: null, score: 0, user });
    }

    // To get the rank, count how many users have a higher score
    const rank = await User.countDocuments({ score: { $gt: user.score } }) + 1;

    res.json({ rank, score: user.score, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
