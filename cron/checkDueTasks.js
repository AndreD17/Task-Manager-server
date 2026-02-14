import cron from "node-cron";
import Task from "../models/Task.js";
import { Op } from "sequelize";
import { sendDueTaskEmail } from "../utils/sendEmail.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";

export const isPastDue = (dueDate) => dueDate && new Date(dueDate) < Date.now();

const SCHEDULE = process.env.CRON_SCHEDULE || "0 * * * *"; // hourly
const DELETE_AFTER_EMAIL = process.env.DELETE_AFTER_EMAIL !== "false"; 
const MAX_RETRIES = parseInt(process.env.CRON_MAX_RETRIES || "3", 10);
const INITIAL_RUN = process.env.RUN_CRON_ON_STARTUP === "true";

let isRunning = false;

async function sendWithRetry(email, description, dueDate) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await sendDueTaskEmail(email, description, dueDate);
      return true;
    } catch (err) {
      const backoff = 1000 * Math.pow(2, attempt);
      logger.warn(`Email send failed (attempt ${attempt}) for ${email}: ${err.message}. Retrying in ${backoff}ms`);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }
  return false;
}

export async function checkDueTasks() {
  if (isRunning) {
    logger.warn("Cron already running — skipping this interval.");
    return;
  }
  isRunning = true;

  logger.info("⏰ Running due tasks check...");

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    const dueTasks = await Task.findAll({
      where: {
        dueDate: { [Op.between]: [oneHourAgo, now] },
        status: { [Op.notIn]: ["completed", "notified"] }, // avoid re-sending
      },
      include: [{ model: User, attributes: ["email"] }],
    });

    if (!dueTasks.length) {
      logger.info("✅ No due tasks in this interval.");
      return;
    }

    for (const task of dueTasks) {
      const userEmail = task.User?.email;
      if (!userEmail) {
        logger.warn(`Task "${task.description}" has no user email.`);
        continue;
      }

      const sent = await sendWithRetry(userEmail, task.description, task.dueDate);

      if (!sent) {
        logger.error(`Failed to send email for task "${task.description}" after ${MAX_RETRIES} attempts`);
        continue;
      }

      logger.info(`📧 Email sent for task "${task.description}" to ${userEmail}`);

      if (DELETE_AFTER_EMAIL) {
        try {
          await task.destroy();
          logger.info(`🗑️ Deleted task "${task.description}"`);
        } catch (err) {
          logger.error(`Failed to delete task "${task.description}": ${err.message}`);
        }
      } else {
        try {
          await task.update({ status: "notified" });
          logger.info(`Marked task "${task.description}" as notified`);
        } catch (err) {
          logger.error(`Failed to update task "${task.description}": ${err.message}`);
        }
      }
    }
  } catch (err) {
    logger.error("❌ Error checking due tasks:", err);
  } finally {
    isRunning = false;
  }
}

// Schedule cron
cron.schedule(SCHEDULE, () => {
  checkDueTasks().catch((err) => logger.error("Cron schedule error:", err));
});

// Optionally run on startup
if (INITIAL_RUN) {
  checkDueTasks().catch((err) => logger.error("Initial cron run error:", err));
}

export default { checkDueTasks };
