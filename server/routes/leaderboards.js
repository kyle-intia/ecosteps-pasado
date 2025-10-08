// server/routes/leaderboards.js
// Public leaderboard routes for community rankings

const express = require('express');
const mongoose = require('mongoose');
const LeaderboardEntry = require('../models/Leaderboards');

const router = express.Router();

// GET /api/leaderboard?tier=gold|silver|bronze
// Returns the top leaderboard entries with optional tier filtering
router.get('/', async (req, res) => {
  try {
    const { tier } = req.query;
    const sortOrder = { score: -1, activity: -1, posts: -1, updatedAt: -1 };

    if (!tier || tier === 'overall') {
      const tierConfigs = [
        { name: 'gold', filter: { score: { $gte: 8000, $lte: 10000 } } },
        { name: 'silver', filter: { score: { $gte: 5000, $lte: 7999 } } },
        { name: 'bronze', filter: { score: { $gte: 2000, $lte: 4999 } } },
      ];

      const leaderboard = [];

      for (const config of tierConfigs) {
        const entry = await LeaderboardEntry.findOne(config.filter)
          .sort(sortOrder)
          .lean();

        if (entry) {
          leaderboard.push({
            ...entry,
            user: entry._id,
            tier: config.name,
          });
        }
      }

      return res.json(leaderboard);
    }

    const scoreFilter = buildTierFilter(tier);

    const leaderboard = await LeaderboardEntry.find(scoreFilter)
      .sort(sortOrder)
      .limit(10)
      .lean();

    const hydratedLeaderboard = leaderboard.map((entry) => ({
      ...entry,
      user: entry._id,
      tier: determineTier(entry.score),
    }));

    return res.json(hydratedLeaderboard);
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return res.status(500).json({ message: 'Failed to load leaderboard data' });
  }
});

// GET /api/leaderboard/rank/:userId
// Returns the rank information for a specific user
router.get('/rank/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ msg: 'Invalid user ID' });
    }

    const entry = await LeaderboardEntry.findById(userId).lean();

    if (!entry) {
      return res.status(404).json({ msg: 'Leaderboard entry not found' });
    }

    if (!entry.score || entry.score <= 0) {
      return res.json({ rank: null, score: entry.score ?? 0, user: { ...entry, user: entry._id } });
    }

    const higherScoreCount = await LeaderboardEntry.countDocuments({ score: { $gt: entry.score } });
    const rank = higherScoreCount + 1;

    return res.json({ rank, score: entry.score, user: { ...entry, user: entry._id } });
  } catch (error) {
    console.error('Leaderboard rank error:', error);
    return res.status(500).json({ message: 'Failed to load leaderboard rank' });
  }
});

function buildTierFilter(tier) {
  if (!tier || tier === 'overall') {
    return {};
  }

  switch (tier) {
    case 'gold':
      return { score: { $gte: 8000, $lte: 10000 } };
    case 'silver':
      return { score: { $gte: 5000, $lte: 7999 } };
    case 'bronze':
      return { score: { $gte: 2000, $lte: 4999 } };
    default:
      return {};
  }
}

function determineTier(score) {
  if (score >= 8000 && score <= 10000) {
    return 'gold';
  }
  if (score >= 5000 && score <= 7999) {
    return 'silver';
  }
  if (score >= 2000 && score <= 4999) {
    return 'bronze';
  }
  return 'unranked';
}

module.exports = router;
