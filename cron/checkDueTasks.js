// cron/checkDueTasks.js
import cron from "node-cron";
import Task from "../models/Task.js";
import { Op } from "sequelize";
import { sendDueTaskEmail } from "../utils/sendEmail.js"; // ✅ Import your mailer
import User from "../models/User.js"; // Needed to get user email
import logger from "../utils/logger.js";
import sequelize from "../config/database.js";

// helpers/date.js
export const isPastDue = (dueDate) => dueDate && new Date(dueDate) < Date.now();

const SCHEDULE = process.env.CRON_SCHEDULE || "0 * * * *"; // default hourly
const DELETE_AFTER_EMAIL = process.env.DELETE_AFTER_EMAIL !== "false"; // default true
const MAX_RETRIES = parseInt(process.env.CRON_MAX_RETRIES || "3", 10);
const INITIAL_RUN = process.env.RUN_CRON_ON_STARTUP === "true";

let isRunning = false; // prevent overlapping runs

async function sendWithRetry(email, description, dueDate) {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      await sendDueTaskEmail(email, description, dueDate);
      return true;
    } catch (err) {
      attempt += 1;
      const backoff = 1000 * Math.pow(2, attempt);
      logger.warn(`Email send failed (attempt ${attempt}) for ${email}: ${err.message}. Retrying in ${backoff}ms`);
      await new Promise((res) => setTimeout(res, backoff));
    }
  }
  return false;
}

async function checkDueTasks() {
  if (isRunning) {
    logger.warn("Cron job already running — skipping this interval.");
    return;
  }
  isRunning = true;

  logger.info("⏰ Checking for due tasks...");

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  try {
    // Ensure DB connection is alive before querying
    try {
      await sequelize.authenticate();
    } catch (dbErr) {
      logger.error("Database not available, skipping cron run:", dbErr.message);
      isRunning = false;
      return;
    }

    const dueTasks = await Task.findAll({
      where: {
        dueDate: {
          [Op.between]: [oneHourAgo, now],
        },
        status: { [Op.ne]: "completed" }, // Not completed
      },
      include: [{ model: User, attributes: ["email"] }], // 🔍 include user info
    });

    if (!dueTasks || dueTasks.length === 0) {
      logger.info("✅ No due tasks in this interval.");
      isRunning = false;
      return;
    }

    for (const task of dueTasks) {
      const userEmail = task.User?.email;
      if (!userEmail) {
        logger.warn(`No email found for user of task "${task.description}"`);
        continue;
      }

      try {
        const sent = await sendWithRetry(userEmail, task.description, task.dueDate);
        if (sent) {
          logger.info(`📧 Email sent for task: "${task.description}" to ${userEmail}`);
          if (DELETE_AFTER_EMAIL) {
            try {
              await task.destroy();
              logger.info(`🗑️ Deleted task: "${task.description}"`);
            } catch (delErr) {
              logger.error(`Failed to delete task "${task.description}": ${delErr.message}`);
            }
          } else {
            // mark notified if you prefer instead of deleting
            try {
              await task.update({ status: "notified" });
              logger.info(`Marked task as notified: "${task.description}"`);
            } catch (updErr) {
              logger.error(`Failed to update task status for "${task.description}": ${updErr.message}`);
            }
          }
        } else {
          logger.error(`Failed to send email for task "${task.description}" after ${MAX_RETRIES} attempts`);
        }
      } catch (taskErr) {
        logger.error(`Unexpected error handling task "${task.description}": ${taskErr.message}`);
      }
    }
  } catch (err) {
    logger.error("❌ Error checking due tasks:", err.message || err);
  } finally {
    isRunning = false;
  }
}

// Schedule the cron job
cron.schedule(SCHEDULE, () => {
  checkDueTasks().catch((e) => logger.error('Cron schedule error:', e.message || e));
});

// Optionally run immediately on startup (useful in containerized apps)
if (INITIAL_RUN) {
  checkDueTasks().catch((e) => logger.error('Initial cron run error:', e.message || e));
}

export default { checkDueTasks };
