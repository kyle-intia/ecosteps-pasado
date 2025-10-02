const express = require('express');
const router = express.Router();
const EmissionFactorService = require('../services/emissionFactorService');

// Create
router.post('/create', async (req, res) => {
  try {
    const factor = await EmissionFactorService.createEmissionFactor(req.body);
    res.status(201).json(factor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Read all
router.get('/', async (req, res) => {
  const factors = await EmissionFactorService.getAllEmissionFactors();
  res.json(factors);
});

// Read by ID
router.get('/:id', async (req, res) => {
  const factor = await EmissionFactorService.getEmissionFactorById(req.params.id);
  if (!factor) return res.status(404).json({ error: 'Not found' });
  res.json(factor);
});

// Update
router.patch('/:id', async (req, res) => {
  try {
    const updated = await EmissionFactorService.updateEmissionFactor(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', async (req, res) => {
  const deleted = await EmissionFactorService.deleteEmissionFactor(req.params.id);
  if (!deleted) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted successfully' });
});


router.get('/all/fetch', async (req, res) => {
  try {
    const formatted = await EmissionFactorService.getFormattedFactors();
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/all', async (req, res) => {
  try {
    const factors = await EmissionFactorService.getFactors();
    res.json(factors);
    } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
