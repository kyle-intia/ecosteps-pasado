const express = require("express");
const router = express.Router();
const { searchFatSecretFoods } = require("../services/foodService");

router.get("/search", async (req, res) => {
  const q = req.query.q;

  if (!q) return res.json({ foods: [] });

  try {
    const foods = await searchFatSecretFoods(q);
    res.json({ foods });
  } catch (err) {
    console.error("FatSecret Error:", err);
    res.json({ foods: [], error: true });
  }
});

module.exports = router;
