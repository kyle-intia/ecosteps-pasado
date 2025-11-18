const express = require("express");
const authenticate = require("../middleware/authenticate");
const RewardService = require("../services/rewardService");

const router = express.Router();

router.use(authenticate);

// fetch rewards with claim status
router.get("/", async (req, res) => {
  try {
    const data = await RewardService.getAllRewards(req.userId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// claim reward
router.post("/:id/claim", async (req, res) => {
  try {
    const claim = await RewardService.claimReward(req.userId, req.params.id);

    if (claim === null)
      return res.status(400).json({ message: "Reward already claimed" });

    if (claim === false)
      return res.status(403).json({ message: "Requirement not met" });

    res.json({ message: "Reward claimed!", claim });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
