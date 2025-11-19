// userCertificateRewardRoute.js
const express = require("express");
const authenticate = require("../middleware/authenticate");
const CertificateRewardService  = require("../services/certificateRewardService");

const router = express.Router();
router.use(authenticate);

// GET user's earned certificates
// GET user's earned certificates, auto-update unlocked ones
router.get("/certificates", async (req, res) => {
  try {
    // Step 1: automatically check and unlock certificates
    await CertificateRewardService.checkCertificatesForUser(req.userId);

    // Step 2: fetch updated certificates with progress
    const list = await CertificateRewardService.getUserCertificates(req.userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET all user's rewards with progress
router.get("/rewards", async (req, res) => {
  try {
    // Step 1: automatically check rewards for user
    await CertificateRewardService.checkRewardsForUser(req.userId);

    // Step 2: fetch updated rewards with progress
    const list = await CertificateRewardService.getUserRewards(req.userId);
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/check", async (req, res) => {
  try {
    const userId = req.userId;

    // Run checks
    await CertificateRewardService.runAllChecksForUser(userId);

    // Fetch full updated lists with progress
    const certificates = await CertificateRewardService.getUserCertificates(userId);
    const rewards = await CertificateRewardService.getUserRewards(userId);

    res.json({ certificates, rewards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Claim a reward
router.post("/rewards/:id/claim", async (req, res) => {
  try {
    const rewardId = req.params.id;
    const result = await CertificateRewardService.claimReward(req.userId, rewardId);
    if (!result.ok) {
      if (result.code === "not_found") return res.status(404).json({ message: "No claim record found" });
      if (result.code === "not_claimable") return res.status(403).json({ message: "Reward not claimable" });
      return res.status(400).json({ message: "Cannot claim" });
    }
    res.json({ message: "Reward claimed", claimedAt: result.claimedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/progress", async (req, res) => {
  try {
    // Compute user stats including all subtypes and daily tracking
    const { totals, activities, dailyStats, monthlyStats } =
      await CertificateRewardService.computeUserStats(req.userId);

    // Compute streak from activity dates
    const streak = CertificateRewardService.computeStreak(totals.dates);

    // Respond with enriched stats
    res.json({
      totals,
      streak,
      activitiesCount: activities.length,
      dailyStats,    // last 7 days footprint
      monthlyStats   // current month footprint
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
