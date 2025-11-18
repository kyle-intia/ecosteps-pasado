const express = require("express");
const authenticate = require("../middleware/authenticate");
const isAdmin = require("../middleware/isAdmin");
const AdminCertificateService = require("../services/adminCertificateService");

const router = express.Router();

router.use(authenticate);
router.use(isAdmin);

// CREATE
router.post("/create", async (req, res) => {
  try {
    const cert = await AdminCertificateService.createCertificate(req.body);
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ALL
router.get("/", async (req, res) => {
  try {
    const list = await AdminCertificateService.getAllCertificates();
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ ONE
router.get("/:id", async (req, res) => {
  try {
    const cert = await AdminCertificateService.getCertificateById(req.params.id);
    if (!cert) return res.status(404).json({ message: "Not found" });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE
router.patch("/:id", async (req, res) => {
  try {
    const cert = await AdminCertificateService.updateCertificate(req.params.id, req.body);
    if (!cert) return res.status(404).json({ message: "Not found" });
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const cert = await AdminCertificateService.deleteCertificate(req.params.id);
    if (!cert) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Certificate deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
