const mongoose = require("mongoose");

const UserCertificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Certificate",
    },
    unlockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("UserCertificate", UserCertificateSchema);
