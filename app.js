import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import setupSwagger from "./swagger.js";
import logger from "./utils/logger.js";
import "./cron/checkDueTasks.js"; 

const app = express();

// =========================
// MIDDLEWARE
// =========================

// Parse cookies first
app.use(cookieParser());

// Parse JSON & URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  "https://task-manager-frontend1-xdkh.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // allow mobile apps, Postman, etc.
      callback(null, allowedOrigins.includes(origin) ? origin : false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("*", cors()); // preflight

// Security headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, // disable if using unsafe-inline scripts
  })
);

// Compression
app.use(compression());

// =========================
// RATE LIMITING
// =========================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 1000, // global limit
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});

app.use(globalLimiter);

// Optional stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 requests per 15 min per IP
  message: "Too many login/signup attempts, please try again later.",
});

app.use("/api/auth", authLimiter);

// =========================
// ROUTES
// =========================
setupSwagger(app);

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

// Health check
app.get("/api/health", (_, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

app.get("/", (req, res) =>
  res.json({ status: "active", message: "Task Manager API is running" })
);

// =========================
// 404 HANDLER
// =========================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});

// =========================
// GLOBAL ERROR HANDLER
// =========================
app.use((err, req, res, next) => {
  logger.error(err.stack || err.message);

  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

export default app;
