import nodemailer from "nodemailer";
import { config } from "../config/config";
import { logger } from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

export const sendWelcomeEmail = async (to: string, username: string) => {
  try {
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: "Welcome to our Chat App!",
      html: `
        <h1>Welcome, ${username}!</h1>
        <p>We're excited to have you on board. Start chatting with your friends now!</p>
      `,
    });
    logger.info(`Welcome email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending welcome email:", error);
  }
};

export const sendPasswordResetEmail = async (
  to: string,
  resetToken: string
) => {
  try {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: config.email.from,
      to,
      subject: "Password Reset Request",
      html: `
        <h1>Password Reset</h1>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
    logger.info(`Password reset email sent to ${to}`);
  } catch (error) {
    logger.error("Error sending password reset email:", error);
  }
};
