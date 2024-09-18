import nodemailer from "nodemailer";

const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const GMAIL_SENDER_MAIL = process.env.GMAIL_SENDER_MAIL || "";

export const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465, false for other ports
  logger: true,
  debug: true,
  auth: {
    user: GMAIL_SENDER_MAIL,
    pass: GMAIL_APP_PASSWORD,
  },
});
