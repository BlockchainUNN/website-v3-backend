"use strict";
// src/middleware/errorHandler.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
exports.notFoundHandler = notFoundHandler;
exports.gracefulShutdown = gracefulShutdown;
const response_1 = require("../lib/response");
const api_types_1 = require("../types/api.types");
const error_1 = require("../lib/error");
// Simple console logger - replace with proper logging library (Winston, etc.)
const logger = {
    error: (message, meta) => {
        console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    },
    warn: (message, meta) => {
        console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    },
    info: (message, meta) => {
        console.info(`[INFO] ${message}`, meta ? JSON.stringify(meta, null, 2) : "");
    },
};
/**
 * Central error handling middleware
 * This should be the last middleware in the chain
 */
function errorHandler(error, req, res, next) {
    var _a;
    // If response has already been sent, delegate to Express default error handler
    if (res.headersSent) {
        return next(error);
    }
    // Log all errors for debugging
    const errorMeta = {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        timestamp: new Date().toISOString(),
    };
    // Handle known operational errors
    if (error instanceof error_1.AppError) {
        logger.warn("Operational error occurred", Object.assign(Object.assign({}, errorMeta), { code: error.code, status: error.status, details: error.details }));
        (0, response_1.errorResponse)(res, {
            code: error.code,
            status: error.status,
            message: error.publicMessage,
            detail: error.details,
        });
    }
    // Handle Prisma errors
    if (error.constructor.name === "PrismaClientKnownRequestError") {
        const prismaError = error;
        logger.warn("Prisma error occurred", Object.assign(Object.assign({}, errorMeta), { prismaCode: prismaError.code, prismaMessage: prismaError.message }));
        const appError = handlePrismaError(prismaError);
        (0, response_1.errorResponse)(res, {
            code: appError.code,
            status: appError.status,
            message: appError.publicMessage,
            detail: appError.details,
        });
    }
    // Handle validation errors from Zod or other validators
    if (error.constructor.name === "ZodError") {
        const zodError = error;
        logger.warn("Validation error occurred", Object.assign(Object.assign({}, errorMeta), { zodErrors: zodError.errors }));
        (0, response_1.errorResponse)(res, {
            code: api_types_1.ErrorCode.VALIDATION_ERROR,
            status: 400,
            message: "Validation failed",
            detail: zodError.errors,
        });
    }
    // Handle JWT errors
    if (error.name === "JsonWebTokenError") {
        logger.warn("JWT error occurred", errorMeta);
        (0, response_1.errorResponse)(res, {
            code: api_types_1.ErrorCode.TOKEN_INVALID,
            status: 401,
            message: "Invalid authentication token",
        });
    }
    if (error.name === "TokenExpiredError") {
        logger.warn("JWT token expired", errorMeta);
        (0, response_1.errorResponse)(res, {
            code: api_types_1.ErrorCode.TOKEN_EXPIRED,
            status: 401,
            message: "Authentication token has expired",
        });
    }
    // Handle multer (file upload) errors
    if (error.constructor.name === "MulterError") {
        const multerError = error;
        logger.warn("File upload error occurred", Object.assign(Object.assign({}, errorMeta), { multerCode: multerError.code }));
        (0, response_1.errorResponse)(res, {
            code: api_types_1.ErrorCode.FILE_UPLOAD_ERROR,
            status: 400,
            message: "File upload failed",
            detail: { reason: multerError.message },
        });
    }
    // Log unexpected errors
    logger.error("Unexpected error occurred", errorMeta);
    // Send generic error response for unknown errors (don't leak details)
    (0, response_1.errorResponse)(res, {
        code: api_types_1.ErrorCode.INTERNAL_SERVER_ERROR,
        status: 500,
        message: "An unexpected error occurred",
        detail: process.env.NODE_ENV === "development"
            ? {
                message: error.message,
                stack: error.stack,
            }
            : undefined,
    });
}
/**
 * Converts Prisma errors to AppErrors
 */
function handlePrismaError(error) {
    var _a, _b, _c, _d;
    switch (error.code) {
        case "P2002": // Unique constraint violation
            const field = ((_b = (_a = error.meta) === null || _a === void 0 ? void 0 : _a.target) === null || _b === void 0 ? void 0 : _b[0]) || "field";
            if (field === "email") {
                return error_1.AppError.emailAlreadyExists(((_d = (_c = error.meta) === null || _c === void 0 ? void 0 : _c.target) === null || _d === void 0 ? void 0 : _d.join(", ")) || "unknown");
            }
            return error_1.AppError.conflict(`${field} already exists`);
        case "P2025": // Record not found
            return error_1.AppError.notFound("Resource not found");
        case "P2003": // Foreign key constraint violation
            return error_1.AppError.badRequest("Invalid reference to related resource");
        case "P2014": // Invalid ID
            return error_1.AppError.badRequest("Invalid ID provided");
        case "P2021": // Table does not exist
        case "P2022": // Column does not exist
            return error_1.AppError.internal("Database schema error");
        default:
            return error_1.AppError.internal("Database operation failed");
    }
}
/**
 * Async error wrapper - catches async errors and passes them to error handler
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * 404 handler for undefined routes
 */
function notFoundHandler(req, res, next) {
    const error = error_1.AppError.notFound(`Route ${req.method} ${req.path} not found`);
    next(error);
}
/**
 * Graceful shutdown handler
 */
function gracefulShutdown(server) {
    process.on("SIGTERM", () => {
        logger.info("SIGTERM received, shutting down gracefully");
        server.close(() => {
            logger.info("Process terminated");
            process.exit(0);
        });
    });
    process.on("SIGINT", () => {
        logger.info("SIGINT received, shutting down gracefully");
        server.close(() => {
            logger.info("Process terminated");
            process.exit(0);
        });
    });
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
        logger.error("Uncaught exception", {
            error: error.message,
            stack: error.stack,
        });
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
        logger.error("Unhandled rejection", { reason, promise });
        process.exit(1);
    });
}
