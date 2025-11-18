const express = require("express");
const authenticate = require("../middleware/authenticate");
const CertificateService = require("../services/certificateService");

const router = express.Router();

router.use(authenticate);

// fetch all certificates
router.get("/", async (req, res) => {
  try {
    const list = await CertificateService.getAllCertificates();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
