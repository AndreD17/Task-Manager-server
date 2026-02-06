import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import DB, models, cron jobs, logger, swagger
import sequelize from "./config/database.js";
import "./models/User.js";
import "./models/Task.js";
import "./cron/checkDueTasks.js";
import logger from "./utils/logger.js";
import setupSwagger from "./swagger.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

const app = express();

// ✅ Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configure helmet with proper security for both API and web
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https:"],
        connectSrc: [
          "'self'",
          "http://localhost:*",
          "https://*.render.com",
          "https://task-manager-server-izto.onrender.com", // ✅ NO trailing slash
        ],
        frameSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameAncestors: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, 
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ✅ Custom middleware to adjust security headers based on route type
app.use((req, res, next) => {
  const path = req.path;
  
  // For API routes, we need CORS and specific headers
  if (path.startsWith('/api/') || path.startsWith('/auth/')) { // ✅ Added /auth/ routes
    // Add CORS headers for API routes
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Origin",
      req.headers.origin || "http://localhost:3000"
    );
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie, X-CSRF-Token"
    );
    res.header("Access-Control-Expose-Headers", "Set-Cookie");
    
    // Relax CSP for API routes to allow connections to various origins
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; connect-src 'self' http://localhost:* https://*.onrender.com https://*.render.com ws://localhost:* wss://*.onrender.com;"
    );
  }
  
  // For Swagger docs, need specific CSP for inline scripts/styles
  else if (path.startsWith('/api-docs')) {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'"
    );
  }
  
  next();
});

// ✅ CORS middleware for API routes
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5000",
      "https://task-manager-server-izto.onrender.com", // ✅ NO trailing slash
      "https://task-manager-frontend-v8z3.onrender.com", // ✅ NO trailing slash
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Check if it's a subdomain pattern match
      const isRenderSubdomain = origin.match(/^https:\/\/task-manager-frontend-[a-z0-9]+\.onrender\.com$/);
      if (isRenderSubdomain) {
        callback(null, true);
      } else {
        callback(null, false); // ✅ Return false instead of error for CORS
      }
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie",
    "X-CSRF-Token",
  ],
  exposedHeaders: ["Set-Cookie", "Authorization"],
  maxAge: 86400, // 24 hours
};

// Apply CORS to all routes
app.use(cors(corsOptions));

// Handle preflight requests
app.options("*", cors(corsOptions));

app.use(compression());

// ✅ Rate limiting (exclude auth/login from rate limiting)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, 
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests from this IP, please try again later.",
    status: 429,
  },
  skip: (req) => {
    // Skip rate limiting for health checks and auth endpoints
    return req.path === "/api/health" || 
           req.path === "/" ||
           req.path === "/auth/login" || 
           req.path === "/auth/register";
  },
});
app.use(limiter); // ✅ Apply to all routes

// ✅ Swagger setup
setupSwagger(app);

// ✅ API routes - FIX: Your frontend is calling /auth/login but your routes are at /api/auth
// Option 1: Keep /api/auth prefix (recommended - more organized)
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/profile", profileRoutes);

// Option 2: Add additional routes without /api prefix (if frontend can't be changed)
app.use("/auth", authRoutes); // This will make /auth/login work

// ✅ Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: "connected",
    version: "1.0.0",
    cors: {
      allowedOrigins: [
        "http://localhost:3000",
        "https://task-manager-frontend-v8z3.onrender.com"
      ]
    }
  });
});

// ✅ Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Task Manager API",
    version: "1.0.0",
    documentation: "/api-docs",
    health: "/api/health",
    endpoints: {
      auth: {
        login: "/api/auth/login (or /auth/login)",
        register: "/api/auth/register",
        logout: "/api/auth/logout"
      },
      tasks: "/api/tasks",
      profile: "/api/profile",
    },
    frontend: "https://task-manager-frontend-v8z3.onrender.com",
    status: "operational",
  });
});

// ✅ 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found",
    path: req.path,
    method: req.method,
    availableEndpoints: [
      "/api/auth/login",
      "/api/auth/register", 
      "/api/tasks",
      "/api/profile", 
      "/api/health"
    ],
    note: "If looking for /auth/login, try /api/auth/login or we also support /auth/login"
  });
});

// ✅ General 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.path,
    suggestion: "Check / for available endpoints",
    frontend: "https://task-manager-frontend-v8z3.onrender.com",
  });
});

// ✅ Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Server error:", err);
  
  // Handle CORS errors
  if (err.message && err.message.includes("CORS")) {
    return res.status(403).json({
      error: "CORS policy violation",
      message: "Origin not allowed",
      allowedOrigins: [
        "http://localhost:3000",
        "https://task-manager-frontend-v8z3.onrender.com",
      ],
      yourOrigin: req.headers.origin || "unknown",
    });
  }
  
  // Handle rate limit errors
  if (err.status === 429) {
    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests from this IP",
      retryAfter: "15 minutes",
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// ✅ Start server
const startServer = async () => {
  try {
    logger.info("🔄 Connecting to PostgreSQL...");
    await sequelize.authenticate();
    logger.info("✅ PostgreSQL authenticated successfully!");

    // Sync database models
    const syncOptions = { alter: process.env.NODE_ENV === "development" };
    await sequelize.sync(syncOptions);
    logger.info("✅ Database models synchronized!");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      logger.info(`🌐 Health check: http://localhost:${PORT}/api/health`);
      logger.info(`🔗 Auth endpoints: http://localhost:${PORT}/api/auth/login`);
      logger.info(`🌍 CORS enabled for: https://task-manager-frontend-v8z3.onrender.com`);
      
      console.log(`\n=== Task Manager Backend ===`);
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints:`);
      console.log(`   - POST ${PORT}/api/auth/login`);
      console.log(`   - POST ${PORT}/api/auth/register`);
      console.log(`   - Also available at ${PORT}/auth/login (no /api prefix)`);
      console.log(`🌍 CORS enabled for:`);
      console.log(`   - https://task-manager-frontend-v8z3.onrender.com`);
      console.log(`   - http://localhost:3000`);
      console.log(`============================\n`);
    });

    // ✅ Graceful shutdown
    const shutdown = async (signal) => {
      logger.warn(`${signal} received, closing server gracefully...`);
      console.log(`\n⚠️  ${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        await sequelize.close();
        logger.info("✅ Database connection closed");
        console.log("✅ Database connection closed");
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("⚠️  Could not close connections in time, forcing shutdown");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // ✅ Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
      console.error("❌ Unhandled Rejection:", reason);
      if (process.env.NODE_ENV === "development") {
        process.exit(1);
      }
    });

    // ✅ Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      logger.error("❌ Uncaught Exception:", error);
      console.error("❌ Uncaught Exception:", error);
      process.exit(1);
    });
  } catch (err) {
    logger.error("❌ Failed to start server:", err);
    console.error("❌ Failed to start server:");
    console.error(err.message);
    
    if (err.message.includes("database") || err.message.includes("authenticate")) {
      console.log("🔄 Retrying database connection in 5 seconds...");
      setTimeout(() => startServer(), 5000);
    } else {
      setTimeout(() => process.exit(1), 2000);
    }
  }
};

// Start the server
startServer();

export default app;