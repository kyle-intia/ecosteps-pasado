const mongoose = require("mongoose");

const CertificateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },

  icon: { type: String },
  color: { type: String },

  date: { type: Date, default: null},

  earned: { type: Boolean, default: false },

  unlockRequirement: {
    type: { type: String, required: true }, 
    value: { type: Number, required: true },
  }
});

module.exports = mongoose.model("Certificate", CertificateSchema);
