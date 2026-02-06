import express from "express";
import { body } from "express-validator";
import { signup, login } from "../controllers/authControllers.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Authentication endpoints
 */

/**
 * @swagger
 * /api/auth/signup: 
 *   post:
 *     summary: Register a new user
 *     tags: 
 *       - Auth  # 👈 signup
 *     description: Creates a new user account.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: User already exists or invalid input.
 */
router.post(
  "/signup",
  [
    body("name", "Name is required").not().isEmpty(),
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  signup
);

/**
 * @swagger
 * /api/auth/login: 
 *   post:
 *     summary: User login
 *     tags: 
 *       - Auth  # 👈 Corrected indentation
 *     description: Authenticates user and returns a JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful, returns token.
 *       400:
 *         description: Invalid credentials.
 */
router.post(
  "/login",
  [
    body("email", "Please include a valid email").isEmail(),
    body("password", "Password is required").exists(),
  ],
  login
);

export default router;
