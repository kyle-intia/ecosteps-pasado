const express = require("express");
const authenticate = require("../middleware/authenticate");
const isAdmin = require("../middleware/isAdmin");
const AdminRewardService = require("../services/adminRewardService");

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

router.post("/create", async (req, res) => {
  try {
    const reward = await AdminRewardService.createReward(req.body);
    res.status(201).json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const list = await AdminRewardService.getAllRewards();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const reward = await AdminRewardService.getRewardById(req.params.id);
    if (!reward) return res.status(404).json({ message: "Not found" });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const reward = await AdminRewardService.updateReward(
      req.params.id,
      req.body,
    );
    if (!reward) return res.status(404).json({ message: "Not found" });
    res.json(reward);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const reward = await AdminRewardService.deleteReward(req.params.id);
    if (!reward) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Reward deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
