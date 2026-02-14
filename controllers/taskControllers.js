import Task from "../models/Task.js";
import logger from "../utils/logger.js";
import { isPastDue } from "../cron/checkDueTasks.js";

/**
 * CONSISTENT STATUS ENUM
 */
const TASK_STATUSES = ["pending", "completed", "inProgress", "cancelled"];

/**
 * GET ALL TASKS
 */
export const getTasks = async (req, res) => {
  try {
    logger.info(`Fetching tasks for user: ${req.user.id}`);

    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    // ✅ REST Correct: Return empty array, not 404
    return res.status(200).json({
      tasks,
      status: true,
      msg: tasks.length ? "Tasks fetched successfully." : "No tasks found.",
    });

  } catch (err) {
    logger.error("Error fetching tasks:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

/**
 * GET SINGLE TASK
 */
export const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findOne({
      where: {
        id: taskId,
        userId: req.user.id, // ✅ ownership check inside DB query
      },
    });

    if (!task) {
      return res.status(404).json({ status: false, msg: "Task not found." });
    }

    return res.status(200).json({
      task,
      status: true,
      msg: "Task fetched successfully.",
    });

  } catch (err) {
    logger.error("Error fetching task:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

/**
 * PATCH TASK STATUS
 */
export const patchTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const taskId = req.params.id;

    if (!TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: "Invalid status value.",
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({ success: false, msg: "Task not found" });
    }

    await task.update({ status });

    return res.json({
      success: true,
      msg: "Status updated successfully",
      task,
    });

  } catch (error) {
    logger.error("Error updating task status:", error);
    return res.status(500).json({ success: false, msg: "Server error" });
  }
};

/**
 * CREATE TASK
 */
export const postTask = async (req, res) => {
  try {
    const { description, dueDate } = req.body;
    const userId = req.user.id;

    if (!description?.trim()) {
      return res.status(400).json({
        status: false,
        msg: "Task description is required",
      });
    }

    const trimmedDescription = description.trim();

    // ✅ Fast duplicate check (indexed columns recommended)
    const existingTask = await Task.findOne({
      where: {
        userId,
        description: trimmedDescription,
      },
      attributes: ["id"],
    });

    if (existingTask) {
      return res.status(400).json({
        status: false,
        msg: "Task already exists.",
      });
    }

    const task = await Task.create({
      userId,
      description: trimmedDescription,
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    return res.status(201).json({
      task,
      status: true,
      msg: "Task created successfully.",
    });

  } catch (err) {
    logger.error("Error creating task:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

/**
 * UPDATE TASK (PUT)
 */
export const putTask = async (req, res) => {
  try {
    const taskId = req.params.id || req.params.taskId;
    const { description, dueDate, status } = req.body;

    const updates = {};

    if (description !== undefined) updates.description = description.trim();
    if (dueDate !== undefined) updates.dueDate = dueDate ? new Date(dueDate) : null;

    if (status !== undefined) {
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({
          status: false,
          msg: "Invalid status value.",
        });
      }
      updates.status = status;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        status: false,
        msg: "No update fields provided.",
      });
    }

    const task = await Task.findOne({
      where: { id: taskId, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        status: false,
        msg: "Task not found.",
      });
    }

    await task.update(updates);

    return res.status(200).json({
      task,
      status: true,
      msg: "Task updated successfully.",
    });

  } catch (err) {
    logger.error("Error updating task:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};

/**
 * DELETE TASK
 */
export const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id || req.params.taskId;

    const task = await Task.findOne({
      where: { id: taskId, userId: req.user.id },
    });

    if (!task) {
      return res.status(404).json({
        status: false,
        msg: "Task not found",
      });
    }

    const wasPastDue = isPastDue(task.dueDate);

    await task.destroy();

    return res.status(200).json({
      status: true,
      msg: wasPastDue
        ? "Past due task deleted successfully."
        : "Task deleted successfully.",
    });

  } catch (err) {
    logger.error("Error deleting task:", err);
    return res.status(500).json({ status: false, msg: "Internal Server Error" });
  }
};
