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

const app = express();

// Parse cookies FIRST
app.use(cookieParser());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const allowedOrigins = [
  "http://localhost:3000",
  "https://task-manager-frontend-v8z3.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.options("*", cors());


app.use(
  helmet({
    crossOriginResourcePolicy: { 
      policy: "cross-origin" 
    },
  })
);

app.use(compression());

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000,
  })
);

setupSwagger(app);


app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

app.get("/api/health", (_, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found",
    path: req.originalUrl,
  });
});



app.use((err, req, res, next) => {
  logger?.error?.(err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

export default app;
