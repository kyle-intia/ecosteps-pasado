"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = void 0;
const resend_1 = __importDefault(require("../config/resend"));
const env_1 = require("../constants/env");
const getFromEmail = () => env_1.NODE_ENV === "development" ? "onboarding@resend.dev" : env_1.EMAIL_SENDER;
const getToEmail = (to) => env_1.NODE_ENV === "development" ? "delivered@resend.dev" : to;
const sendMail = async ({ to, subject, text, html }) => {
    try {
        const response = await resend_1.default.emails.send({
            from: getFromEmail(),
            to: getToEmail(to),
            subject,
            text,
            html,
        });
        // Log success
        console.log(`Email sent to ${to} with subject "${subject}"`);
        return response; // Optionally return the response for further handling
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send email");
    }
};
exports.sendMail = sendMail;
