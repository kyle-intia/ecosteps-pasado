// userCertificateRewardRoute.js
const express = require("express");
const authenticate = require("../middleware/authenticate");
const CertificateRewardService  = require("../services/certificateRewardService");
const { sendMail } = require("../utils/sendMail"); 

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
      if (result.code === "not_found")
        return res.status(404).json({ message: "No claim record found" });
      if (result.code === "not_claimable")
        return res.status(403).json({ message: "Reward not claimable" });
      return res.status(400).json({ message: "Cannot claim" });
    }

    // Extract user data
    const userEmail = req.user.email;
    const userName = req.user.name || "EcoSteps User";
    const rewardName = result.rewardItem;
    const claimDate = new Date(result.claimedAt).toLocaleString();

    // Send email
    await sendMail({
      to: userEmail,
      subject: `🎉 You Just Claimed: ${rewardName}!`,
      text: `
        Hi ${userName},
            
        Congratulations! You've successfully claimed your reward: ${rewardName} on ${claimDate}.
            
        📦 HOW TO RECEIVE YOUR REWARD
        To claim your physical reward:
        1. Open the EcoSteps app
        2. Go to "Rewards > Claimed Rewards"
        3. Follow the pickup or delivery instructions shown for this item
            
        Thank you for helping build a greener world! 🌱
        – The EcoSteps Team
              `,
              html: `
        <div style="font-family: Arial, sans-serif; background: #f4f7f9; padding: 20px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <h2 style="text-align: center; color: #2e7d32; margin-top: 0;">
              🎉 Congratulations, ${userName}!
            </h2>
            
            <p style="font-size: 16px; color: #333; text-align: center;">
              You have successfully claimed your reward:
            </p>
            
            <div style="padding: 16px; background: #e8f5e9; border-radius: 10px; margin: 0 auto 20px auto; text-align: center; max-width: 300px;">
              <h3 style="margin: 0; color: #1b5e20;">${rewardName}</h3>
              <p style="margin: 4px 0; font-size: 14px; color: #4caf50;">
                Claimed on: <strong>${claimDate}</strong>
              </p>
            </div>
            
            <h3 style="color: #2e7d32; text-align: center;">📦 How to Receive Your Reward</h3>
            
            <div style="text-align: center; margin-top: 10px;">
              <p style="font-size: 15px; color: #444; margin-bottom: 12px;">
                You can choose how you want to receive your reward:
              </p>
            
              <!-- OPTION 1 -->
              <div style="margin: 15px auto; max-width: 350px; padding: 15px; background: #FFFBEA; border: 1px solid #FFEB99; border-radius: 8px;">
                <h4 style="margin: 0; color: #9C6E00;">🏢 Option 1: Claim at EcoSteps Center</h4>
                <p style="font-size: 14px; color: #555; margin-top: 6px;">
                  Visit the EcoSteps Center and show this email or your app's "Claimed Rewards" screen.
                </p>
              </div>
            
              <!-- OPTION 2 -->
              <div style="margin: 15px auto; max-width: 350px; padding: 15px; background: #E3F2FD; border: 1px solid #90CAF9; border-radius: 8px;">
                <h4 style="margin: 0; color: #0D47A1;">📮 Option 2: Request Delivery</h4>
                <p style="font-size: 14px; color: #555; margin-top: 6px;">
                  Reply to this email with your delivery address, and our team will assist you.
                </p>
              </div>
            </div>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
            
            <p style="font-size: 14px; color: #666; text-align: center;">
              Thank you for being part of EcoSteps and helping make the world greener! 🌍💚
            </p>
            
            <p style="font-size: 14px; color: #444; text-align: center; margin-top: 20px;">
              – The <strong>EcoSteps Team</strong>
            </p>
            
          </div>
        </div>
        `
    });

    res.json({ message: "Reward claimed", claimedAt: result.claimedAt });

  } catch (err) {
    console.error("CLAIM ERROR:", err);
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
