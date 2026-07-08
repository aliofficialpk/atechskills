import nodemailer from "nodemailer";
import { env } from "../config.js";

export function isEmailConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
}

export async function sendOtpEmail(to: string, code: string) {
  if (!isEmailConfigured()) {
    throw new Error("Email OTP is not configured.");
  }

  const port = env.SMTP_PORT ?? 587;
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  const from = env.SMTP_FROM ?? `AtechSkills <${env.SMTP_USER}>`;
  await transporter.sendMail({
    from,
    to,
    subject: "Your AtechSkills verification code",
    text: `Your AtechSkills verification code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
        <h2 style="color:#064e3b">Verify your AtechSkills account</h2>
        <p>Your one-time verification code is:</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:6px;color:#dc2626">${code}</p>
        <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}
