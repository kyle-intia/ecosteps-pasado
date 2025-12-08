"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVerifyEmailTemplate = exports.getPasswordResetTemplate = void 0;
const getPasswordResetTemplate = (url) => ({
  subject: "Password Reset Request",
  text: `You requested a password reset. Click on the link to reset your password: ${url}`,
  html: `
    <!doctype html>
    <html lang="en-US">
      <head>
        <meta charset="utf-8" />
        <title>Reset Password</title>
        <style>
          a:hover { text-decoration: underline; }
          body { background-color: #f2f3f8; font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; }
          table { width: 100%; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 3px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
          h1 { color: #333; font-size: 24px; }
          p { color: #555; font-size: 16px; }
          a { display: inline-block; padding: 12px 20px; background-color: #2f89ff; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td style="padding: 40px 20px; text-align: center;">
            <h1>Password Reset</h1>
            <p>Click the link below to reset your password:</p>
            <a href="${url}">Reset Password</a>
          </td></tr>
        </table>
      </body>
    </html>
  `
});
exports.getPasswordResetTemplate = getPasswordResetTemplate;

const getVerifyEmailTemplate = (url) => ({
  subject: "Verify Your Email Address",
  text: `Click on the link to verify your email address: ${url}`,
  html: `
    <!doctype html>
    <html lang="en-US">
      <head>
        <meta charset="utf-8" />
        <title>Verify Email Address</title>
        <style>
          a:hover { text-decoration: underline; }
          body { background-color: #f2f3f8; font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; }
          table { width: 100%; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 3px; box-shadow: 0 6px 18px rgba(0,0,0,0.06); }
          h1 { color: #333; font-size: 24px; }
          p { color: #555; font-size: 16px; }
          a { display: inline-block; padding: 12px 20px; background-color: #2f89ff; color: #fff; text-decoration: none; border-radius: 5px; font-size: 16px; }
        </style>
      </head>
      <body>
        <table>
          <tr><td style="padding: 40px 20px; text-align: center;">
            <h1>Email Verification</h1>
            <p>Click the link below to verify your email address:</p>
            <a href="${url}">Verify Email Address</a>
          </td></tr>
        </table>
      </body>
    </html>
  `
});
exports.getVerifyEmailTemplate = getVerifyEmailTemplate;
