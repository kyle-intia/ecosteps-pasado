const express = require("express");
const router = express.Router();
const { sendMail } = require("../utils/sendMail");

router.post("/", async (req, res) => {
  try {
    const { to, subject, message } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        ${message.replace(/\n/g, "<br/>")}
      </div>
    `;

    const response = await sendMail({
      to,
      subject,
      text: message,
      html: htmlContent,
    });

    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Email send error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

module.exports = router;
