const express = require("express");
const router = express.Router();
const EcoChallengeService = require("../services/ecoChallengeService");

router.post("/create", async (req, res) => {
  try {
    const challenge = await EcoChallengeService.createChallenge(req.body);
    res.status(201).json(challenge);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const challenges = await EcoChallengeService.getAllChallenges();
    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/fetch", async (req, res) => {
  try {
    const challengesArray = await EcoChallengeService.getAllChallenges();
    const challengeLibrary = challengesArray.reduce((acc, challenge) => {
      acc[challenge.id] = challenge;
      return acc;
    }, {});
    res.status(200).json(challengeLibrary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const challenge = await EcoChallengeService.getChallengeById(req.params.id);
    res.status(200).json(challenge);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updated = await EcoChallengeService.updateChallenge(
      req.params.id,
      req.body,
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await EcoChallengeService.deleteChallenge(req.params.id);
    res.status(200).json(deleted);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
