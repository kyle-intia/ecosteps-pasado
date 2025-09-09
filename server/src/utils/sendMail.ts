import resend from "../config/resend";
import { EMAIL_SENDER, NODE_ENV } from "../constants/env";

type Params = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const getFromEmail = () =>
  NODE_ENV === "development" ? "onboarding@resend.dev" : EMAIL_SENDER;

const getToEmail = (to: string) =>
  NODE_ENV === "development" ? "delivered@resend.dev" : to;

export const sendMail = async ({ to, subject, text, html }: Params): Promise<any> => {
  try {
    const response = await resend.emails.send({
      from: getFromEmail(),
      to: getToEmail(to),
      subject,
      text,
      html,
    });

    // Log success
    console.log(`Email sent to ${to} with subject "${subject}"`);

    return response; // Optionally return the response for further handling
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};
