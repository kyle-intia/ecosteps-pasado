const mongoose = require('mongoose');

const ecoChallengeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  calculationType: { type: String, required: true },
  savingsValue: { type: String, required: true },
  targetQuestion: { type: String, },
  overrideValue: { type: String, },
}, {
  timestamps: true,
});

module.exports = mongoose.model('EcoChallenge', ecoChallengeSchema);
