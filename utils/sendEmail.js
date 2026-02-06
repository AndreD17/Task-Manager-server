import nodemailer from "nodemailer";
import logger from "./logger.js";

const hasEmailConfig = process.env.EMAIL_USER && process.env.EMAIL_PASS;

let transporter;

if (hasEmailConfig) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password
    },
  });



  transporter.verify((error) => {
    if (error) {
      console.error("❌ EMAIL verify failed — FULL ERROR ↓↓↓");
      console.error(error);
    } else {
      logger.info("✅ EMAIL server is ready to send emails");
    }
  });
} else {
  logger.warn("⚠️ Email config missing. Emails will not be sent.");
}

export const sendDueTaskEmail = async (to, taskDesc, dueDate) => {
  if (!transporter) {
    logger.error("❌ Email transporter not initialized");
    return;
  }

  const parsedDate = new Date(dueDate);
  const formattedDate = !isNaN(parsedDate)
    ? parsedDate.toLocaleString("en-US", { timeZone: "UTC" })
    : "Not Set";

  if (!to || !/\S+@\S+\.\S+/.test(to)) {
    logger.warn(`❌ Invalid email address: ${to}`);
    return;
  }

  const mailOptions = {
    from: `"Task Manager" <${process.env.EMAIL_USER}>`,
    to,
    subject: "⚠️ Your Task is Due!",
    html: `
      <h2>🚨 Task Due Alert</h2>
      <p><strong>Task:</strong> ${taskDesc}</p>
      <p><strong>Due Date:</strong> ${formattedDate}</p>
      <p>Please complete it soon or it will be deleted in an hour.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`📧 Email sent for task: "${taskDesc}" to ${to}`);
  } catch (err) {
    console.error("❌ Error sending due task email — FULL ERROR ↓↓↓");
    console.error(err);
  }
};
