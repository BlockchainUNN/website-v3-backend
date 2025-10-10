// src/server.ts

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "fs";
import path from "path";
import userRoutes from "./routes/users/users.routes";
import eventRoutes from "./routes/events/events.routes";
import blogRoutes from "./routes/blog/blog.routes";
import adminRoutes from "./routes/admin/admin.routes";
import hackersRoutes from "./routes/hackathons/hackers.routes";
import teamsRoutes from "./routes/hackathons/teams.routes";
import { logAuthAttempt } from "./middlewares/auth";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler";
import { sanitizeInput } from "./middlewares/validation";

// Environment configuration
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || "127.0.0.1";
const EXTERNAL_HOST = process.env.EXTERNAL_HOST || `${HOST}:${PORT}`;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// Trust proxy (important for production deployments)
app.set("trust proxy", 1);

// Security and CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Define allowed origins based on environment
    const allowedOrigins =
      NODE_ENV === "production"
        ? [
            "https://www.blockchainunn.org",
            "https://blockchainunn.org",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
          ]
        : ["http://localhost:3000", "http://127.0.0.1:3000", origin];

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true, // Allow cookies and auth headers
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));

// Security middleware
app.use(sanitizeInput()); // Basic XSS protection

// Request logging
if (NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || "1.0.0",
    },
  });
});

// Swagger documentation setup
try {
  const swaggerPath = path.join(__dirname, "swagger", "swagger-output.json");
  const rawData = readFileSync(swaggerPath, "utf-8");
  const swaggerFile = JSON.parse(rawData);

  // Enhance swagger with security definitions
  swaggerFile.components = swaggerFile.components || {};
  swaggerFile.components.securitySchemes = {
    bearerAuth: {
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  };

  app.use(
    "/api/v3/doc",
    swaggerUi.serve,
    swaggerUi.setup(swaggerFile, {
      explorer: true,
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "BlockchainUNN API Documentation",
      swaggerOptions: {
        persistAuthorization: true,
      },
    })
  );
} catch (error) {
  console.warn("Swagger documentation setup failed:", error);
}

// Default route with API info
app.get("/", (req, res) => {
  res.send(`
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
      <h1>BlockchainUNN Backend API</h1>
      <p>Welcome to the BlockchainUNN backend service.</p>
      <h2>Documentation</h2>
      <p><a href="http://${EXTERNAL_HOST}/api/v3/doc" target="_blank">📖 View API Documentation</a></p>
      <h2>Health Check</h2>
      <p><a href="http://${EXTERNAL_HOST}/health" target="_blank">🔍 Health Status</a></p>
      <hr>
      <p><small>Environment: ${NODE_ENV} | Version: ${
    process.env.npm_package_version || "1.0.0"
  }</small></p>
    </div>
  `);
});

// API versioning prefix
// const API_V3 = "/api/v3";

// Auth attempt logging (for security monitoring)
app.use("/api/v3", logAuthAttempt);

// ============================================================================
// NEW REFACTORED ROUTES (with consistent patterns)
// ============================================================================

// Public routes (no authentication required)
app.use("/api/v3", userRoutes); // Includes public user registration and login

// Protected routes (authentication required)
// Note: Individual routes within these modules handle their own permission checks
app.use("/api/v3", eventRoutes);
app.use("/api/v3", blogRoutes);
app.use("/api/v3", hackersRoutes);
app.use("/api/v3", teamsRoutes);

// Admin routes (admin permissions required)
app.use("/api/v3", adminRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// ============================================================================
// SERVER STARTUP
// ============================================================================

const server = app.listen(PORT, () => {
  console.log("🚀 Server starting up...");
  console.log(`📍 Server running at http://${HOST}:${PORT}`);
  console.log(`📖 API Documentation: http://${EXTERNAL_HOST}/api/v3/doc`);
  console.log(`🔍 Health Check: http://${EXTERNAL_HOST}/health`);
  console.log(`🌍 Environment: ${NODE_ENV}`);

  if (NODE_ENV === "development") {
    console.log("🔧 Development mode - detailed logging enabled");
  }

  console.log("✅ Server ready to accept connections");
});

export default app;
export { PORT, HOST, EXTERNAL_HOST };
