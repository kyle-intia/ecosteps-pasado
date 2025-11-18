const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String }, // matches TS interface

  icon: { type: String },
  color: { type: String },

  date: { type: Date, default: null},

  earned: { type: Boolean, default: false },

  unlockRequirement: {
    type: { type: String, required: true }, // e.g. "walk"
    value: { type: Number, required: true }, // e.g. 1000
  }
});

module.exports = mongoose.model("Certificate", CertificateSchema);
