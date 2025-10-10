"use strict";
// src/server.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTERNAL_HOST = exports.HOST = exports.PORT = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const users_routes_1 = __importDefault(require("./routes/users/users.routes"));
const events_routes_1 = __importDefault(require("./routes/events/events.routes"));
const blog_routes_1 = __importDefault(require("./routes/blog/blog.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin/admin.routes"));
const hackers_routes_1 = __importDefault(require("./routes/hackathons/hackers.routes"));
const teams_routes_1 = __importDefault(require("./routes/hackathons/teams.routes"));
const auth_1 = require("./middlewares/auth");
const errorHandler_1 = require("./middlewares/errorHandler");
const validation_1 = require("./middlewares/validation");
// Environment configuration
const PORT = process.env.PORT || 8000;
exports.PORT = PORT;
const HOST = process.env.HOST || "127.0.0.1";
exports.HOST = HOST;
const EXTERNAL_HOST = process.env.EXTERNAL_HOST || `${HOST}:${PORT}`;
exports.EXTERNAL_HOST = EXTERNAL_HOST;
const NODE_ENV = process.env.NODE_ENV || "development";
const app = (0, express_1.default)();
// Trust proxy (important for production deployments)
app.set("trust proxy", 1);
// Security and CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        // Define allowed origins based on environment
        const allowedOrigins = [
            "https://www.blockchainunn.org",
            "https://blockchainunn.org",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ];
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        else {
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
    },
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true, // Allow cookies and auth headers
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing middleware
app.use(body_parser_1.default.urlencoded({ extended: true, limit: "10mb" }));
app.use(body_parser_1.default.json({ limit: "10mb" }));
// Security middleware
app.use((0, validation_1.sanitizeInput)()); // Basic XSS protection
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
    const swaggerPath = path_1.default.join(__dirname, "swagger", "swagger-output.json");
    const rawData = (0, fs_1.readFileSync)(swaggerPath, "utf-8");
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
    app.use("/api/v3/doc", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerFile, {
        explorer: true,
        customCss: ".swagger-ui .topbar { display: none }",
        customSiteTitle: "BlockchainUNN API Documentation",
        swaggerOptions: {
            persistAuthorization: true,
        },
    }));
}
catch (error) {
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
      <p><small>Environment: ${NODE_ENV} | Version: ${process.env.npm_package_version || "1.0.0"}</small></p>
    </div>
  `);
});
// API versioning prefix
// const API_V3 = "/api/v3";
// Auth attempt logging (for security monitoring)
app.use("/api/v3", auth_1.logAuthAttempt);
// ============================================================================
// NEW REFACTORED ROUTES (with consistent patterns)
// ============================================================================
// Public routes (no authentication required)
app.use("/api/v3", users_routes_1.default); // Includes public user registration and login
// Protected routes (authentication required)
// Note: Individual routes within these modules handle their own permission checks
app.use("/api/v3", events_routes_1.default);
app.use("/api/v3", blog_routes_1.default);
app.use("/api/v3", hackers_routes_1.default);
app.use("/api/v3", teams_routes_1.default);
// Admin routes (admin permissions required)
app.use("/api/v3", admin_routes_1.default);
// ============================================================================
// ERROR HANDLING
// ============================================================================
// 404 handler for undefined routes
app.use(errorHandler_1.notFoundHandler);
// Global error handler (must be last)
app.use(errorHandler_1.errorHandler);
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
exports.default = app;
