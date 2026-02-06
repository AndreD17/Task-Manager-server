import express from "express";
import { getTasks, getTask, postTask, putTask, deleteTask } from "../controllers/taskControllers.js";
import { verifyAccessToken } from "../middlewares/index.js";
import "../cron/checkDueTasks.js";
import { patchTaskStatus } from "../controllers/taskControllers.js";



const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: 
 *       - Tasks # 👈 Fetch all tasks
 *     description: Retrieve all tasks for the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tasks created by the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       completed:
 *                         type: boolean
 *                         example: false
 */
router.get("/", verifyAccessToken, getTasks);



/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     description: Add a new task for the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Go for a walk"
 *               description:
 *                 type: string
 *                 example: "Evening walk in the park"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-04-14T18:00:00Z"
 *     responses:
 *       201:
 *         description: Task successfully created.
 */
router.post("/", verifyAccessToken, postTask);

/**
 * @swagger
 * /api/tasks/{id}/status:
 *   patch:
 *     summary: Update task status
 *     description: "Update only the status of a task"
 *     tags:
 *       - Tasks
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Task status updated successfully
 */
router.patch("/:id/status", verifyAccessToken, patchTaskStatus);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a single task
 *     tags: [Tasks]
 *     description: Retrieve a specific task by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID.
 *     responses:
 *       200:
 *         description: Task found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *       404:
 *         description: Task not found.
 */
router.get("/:id", verifyAccessToken, getTask);



/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     tags: [Tasks]
 *     description: Update a task for the logged-in user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Buy groceries"
 *               description:
 *                 type: string
 *                 example: "Milk, eggs, and bread"
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-04-14T18:00:00Z"
 *               completed:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Task successfully updated.
 *       400:
 *         description: Bad request.
 *       404:
 *         description: Task not found.
 */
router.put("/:id", verifyAccessToken, putTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     description: Remove a task by ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The task ID to delete.
 *     responses:
 *       200:
 *         description: Task successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Task not found.
 */


router.delete("/:id", verifyAccessToken, deleteTask);


export default router;
