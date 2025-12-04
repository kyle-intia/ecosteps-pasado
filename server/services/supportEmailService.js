"use strict";

const resend = require("../config/resend").default;
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL;
const EMAIL_SENDER = process.env.EMAIL_SENDER;

const sendSupportMail = async ({ from, subject, text, html }) => {
  try {
    const response = await resend.emails.send({
      from: EMAIL_SENDER, 
      to: SUPPORT_EMAIL,   
      subject,
      text,
      html,
      reply_to: from,
    });

    console.log(`Support email sent. User: ${from}, Subject: "${subject}"`);
    return response;
  } catch (error) {
    console.error("Error sending support email:", error);
    throw new Error("Failed to send support email");
  }
};

module.exports = { sendSupportMail };
