"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;

const resend_1 = __importDefault(require("../config/resend"));
const env_1 = require("../constants/env");

const getFromEmail = () => `"EcoSteps Support" <${env_1.EMAIL_SENDER}>`;

const getToEmail = (to) => to;

const sendMail = async ({ to, subject, text, html }) => {
  try {
    const response = await resend_1.default.emails.send({
      from: getFromEmail(),
      to: getToEmail(to),
      subject,
      text,
      html,
    });
    console.log(`Email sent to ${to} with subject "${subject}"`);
    return response;
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
exports.sendMail = sendMail;
