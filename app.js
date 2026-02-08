import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import sequelize from "./config/database.js";
import "./models/User.js";
import "./models/Task.js";
import "./cron/checkDueTasks.js";

import logger from "./utils/logger.js";
import setupSwagger from "./swagger.js";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

dotenv.config();

const app = express();

/* -------------------- BASIC MIDDLEWARE -------------------- */
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* -------------------- SECURITY -------------------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(compression());

/* -------------------- CORS CONFIG (FIXED) -------------------- */
const allowedOrigins = [
  "http://localhost:3000",
  "https://task-manager-frontend-v8z3.onrender.com",
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman / curl / mobile apps
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // ❌ DO NOT throw error – let browser handle rejection
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ IMPORTANT

/* -------------------- RATE LIMIT -------------------- */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    req.path.startsWith("/api/auth") ||
    req.path === "/api/health",
});

app.use(limiter);

/* -------------------- SWAGGER -------------------- */
setupSwagger(app);

/* -------------------- ROUTES -------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

/* -------------------- HEALTH CHECK -------------------- */
app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

/* -------------------- ROOT -------------------- */
app.get("/", (_, res) => {
  res.json({
    message: "Task Manager API",
    version: "1.0.0",
    frontend: "https://task-manager-frontend-v8z3.onrender.com",
  });
});

/* -------------------- 404 HANDLERS -------------------- */
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
  });
});

/* -------------------- GLOBAL ERROR HANDLER -------------------- */
app.use((err, req, res, next) => {
  logger.error(err);

  if (err.message?.includes("CORS")) {
    return res.status(403).json({
      error: "CORS error",
      origin: req.headers.origin,
    });
  }

  res.status(500).json({
    error: "Internal server error",
  });
});

/* -------------------- SERVER START -------------------- */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    logger.info("✅ Database connected");

    await sequelize.sync();
    logger.info("✅ Models synced");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("❌ Server startup failed", err);
    process.exit(1);
  }
};

startServer();

export default app;
