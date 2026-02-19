const mongoose = require("mongoose");

const EmissionFactorSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    type: { type: String, required: true },
    unit: { type: String, required: true },
    value: { type: Number, required: true },
    source: { type: String },
  },
  { timestamps: true },
);

const EmissionFactorModel = mongoose.model(
  "EmissionFactor",
  EmissionFactorSchema,
);

module.exports = EmissionFactorModel;
