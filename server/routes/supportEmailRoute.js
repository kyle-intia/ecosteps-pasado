"use strict";
const express = require("express");
const router = express.Router();
const { sendSupportMail } = require("../services/supportEmailService");

router.post("/", async (req, res) => {
  try {
    const { email, subject, message } = req.body;

    if (!email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: "email, subject, and message are required",
      });
    }

    await sendSupportMail({
      from: email,
      subject,
      text: message,
      html: `<p>${message}</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Support email sent successfully",
    });
  } catch (error) {
    console.error("Error in /contact-email route:", error);

    return res.status(500).json({
      success: false,
      error: "Failed to send support email",
    });
  }
});

module.exports = router;
