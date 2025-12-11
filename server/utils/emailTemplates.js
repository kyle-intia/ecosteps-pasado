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
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <title>Reset Password Email Template</title>
    <meta name="description" content="Reset Password Email Template.">
    <style type="text/css">
        a:hover {
            text-decoration: underline!important;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #f2f3f8;
            font-family: 'Open Sans', sans-serif;
        }
        table {
            width: 100%;
            border-spacing: 0;
            border-collapse: collapse;
        }
        .container {
            max-width: 670px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-top: 50px;
        }
        h1 {
            color: #1e1e2d;
            font-weight: 600;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .divider {
            border-bottom: 2px solid #f1f1f1;
            width: 100px;
            margin: 20px auto;
        }
        .header-image {
    		width: 60%;
            height: 60%;
            margin: auto;
      		display: block;
    	}
        p {
            color: #455056;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #2f89ff;
            color: #ffffff;
            text-transform: uppercase;
            font-weight: 600;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #1e66d3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: rgba(69, 80, 86, 0.74);
        }
    </style>
</head>
<body>

    <img 
      src="https://res.cloudinary.com/dbrqfyxo0/image/upload/v1765203837/Untitled_design_rquhbk.jpg" 
      alt="EcoWalk Header" 
      class="header-image"
    />
    
    <table cellspacing="0" cellpadding="0" bgcolor="#f2f3f8">
        <tr>
            <td>
                <table class="container" cellspacing="0" cellpadding="0">
                    <!-- Header Space -->
                    <tr>
                        <td class="header">
                            <h1>You have requested to reset your password</h1>
                            <div class="divider"></div>
                            <p>A unique link to reset your password has been generated for you. To reset your password, click the following link and follow the instructions.</p>
                            <a href="${url}" class="button" target="_blank">Reset Password</a>
                        </td>
                    </tr>
                    <!-- Footer Space -->
                    <tr>
                        <td style="height: 40px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>&copy; EcoSteps. All rights reserved.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
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
    <meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>
    <title>Verify Email Address Email Template</title>
    <meta name="description" content="Verify Email Address Email Template.">
    <style type="text/css">
        a:hover {
            text-decoration: underline!important;
        }
        body {
            margin: 0;
            padding: 0;
            background-color: #f2f3f8;
            font-family: 'Open Sans', sans-serif;
        }
        table {
            width: 100%;
            border-spacing: 0;
            border-collapse: collapse;
        }
        .container {
            max-width: 670px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            padding-top: 50px;
        }
        .header-image {
    		width: 60%;
            height: 60%;
            margin: auto;
      		display: block;
    	}
        h1 {
            color: #1e1e2d;
            font-weight: 600;
            font-size: 28px;
            margin-bottom: 20px;
        }
        .divider {
            border-bottom: 2px solid #f1f1f1;
            width: 100px;
            margin: 20px auto;
        }
        p {
            color: #455056;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 20px;
        }
        .button {
            display: inline-block;
            background-color: #2f89ff;
            color: #ffffff;
            text-transform: uppercase;
            font-weight: 600;
            padding: 12px 30px;
            border-radius: 50px;
            text-decoration: none;
            font-size: 16px;
            transition: background-color 0.3s;
        }
        .button:hover {
            background-color: #1e66d3;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 14px;
            color: rgba(69, 80, 86, 0.74);
        }
    </style>
</head>
<body>

    <img 
      src="https://res.cloudinary.com/dbrqfyxo0/image/upload/v1765203837/Untitled_design_rquhbk.jpg" 
      alt="EcoWalk Header" 
      class="header-image"
    />
    
    <table cellspacing="0" cellpadding="0" bgcolor="#f2f3f8">
        <tr>
            <td>
                <table class="container" cellspacing="0" cellpadding="0">
                    <tr>
                        <td class="header">
                            <h1>Please Verify Your Email Address</h1>
                            <div class="divider"></div>
                            <p>Click on the following link to verify your email address.</p>
                            <a href="${url}" class="button" target="_blank">Verify Email Address</a>
                        </td>
                    </tr>
                    <!-- Footer Space -->
                    <tr>
                        <td style="height: 40px;">&nbsp;</td>
                    </tr>
                    <tr>
                        <td class="footer">
                            <p>&copy; EcoSteps. All rights reserved.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="height: 80px;">&nbsp;</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
  `
});
exports.getVerifyEmailTemplate = getVerifyEmailTemplate;
