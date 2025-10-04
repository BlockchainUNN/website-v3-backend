// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from "express";
import { errorResponse } from "../lib/response";
import { ErrorCode } from "../types/api.types";
import { AppError } from "../lib/error";

// Enhanced logger for production use
interface Logger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
}

// Simple console logger - replace with proper logging library (Winston, etc.)
const logger: Logger = {
  error: (message: string, meta?: any) => {
    console.error(
      `[ERROR] ${message}`,
      meta ? JSON.stringify(meta, null, 2) : ""
    );
  },
  warn: (message: string, meta?: any) => {
    console.warn(
      `[WARN] ${message}`,
      meta ? JSON.stringify(meta, null, 2) : ""
    );
  },
  info: (message: string, meta?: any) => {
    console.info(
      `[INFO] ${message}`,
      meta ? JSON.stringify(meta, null, 2) : ""
    );
  },
};

/**
 * Central error handling middleware
 * This should be the last middleware in the chain
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
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
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  };

  // Handle known operational errors
  if (error instanceof AppError) {
    logger.warn("Operational error occurred", {
      ...errorMeta,
      code: error.code,
      status: error.status,
      details: error.details,
    });

    errorResponse(res, {
      code: error.code,
      status: error.status,
      message: error.publicMessage,
      detail: error.details,
    });
  }

  // Handle Prisma errors
  if (error.constructor.name === "PrismaClientKnownRequestError") {
    const prismaError = error as any;
    logger.warn("Prisma error occurred", {
      ...errorMeta,
      prismaCode: prismaError.code,
      prismaMessage: prismaError.message,
    });

    const appError = handlePrismaError(prismaError);
    errorResponse(res, {
      code: appError.code,
      status: appError.status,
      message: appError.publicMessage,
      detail: appError.details,
    });
  }

  // Handle validation errors from Zod or other validators
  if (error.constructor.name === "ZodError") {
    const zodError = error as any;
    logger.warn("Validation error occurred", {
      ...errorMeta,
      zodErrors: zodError.errors,
    });

    errorResponse(res, {
      code: ErrorCode.VALIDATION_ERROR,
      status: 400,
      message: "Validation failed",
      detail: zodError.errors,
    });
  }

  // Handle JWT errors
  if (error.name === "JsonWebTokenError") {
    logger.warn("JWT error occurred", errorMeta);

    errorResponse(res, {
      code: ErrorCode.TOKEN_INVALID,
      status: 401,
      message: "Invalid authentication token",
    });
  }

  if (error.name === "TokenExpiredError") {
    logger.warn("JWT token expired", errorMeta);

    errorResponse(res, {
      code: ErrorCode.TOKEN_EXPIRED,
      status: 401,
      message: "Authentication token has expired",
    });
  }

  // Handle multer (file upload) errors
  if (error.constructor.name === "MulterError") {
    const multerError = error as any;
    logger.warn("File upload error occurred", {
      ...errorMeta,
      multerCode: multerError.code,
    });

    errorResponse(res, {
      code: ErrorCode.FILE_UPLOAD_ERROR,
      status: 400,
      message: "File upload failed",
      detail: { reason: multerError.message },
    });
  }

  // Log unexpected errors
  logger.error("Unexpected error occurred", errorMeta);

  // Send generic error response for unknown errors (don't leak details)
  errorResponse(res, {
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    status: 500,
    message: "An unexpected error occurred",
    detail:
      process.env.NODE_ENV === "development"
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
function handlePrismaError(error: any): AppError {
  switch (error.code) {
    case "P2002": // Unique constraint violation
      const field = error.meta?.target?.[0] || "field";
      if (field === "email") {
        return AppError.emailAlreadyExists(
          error.meta?.target?.join(", ") || "unknown"
        );
      }
      return AppError.conflict(`${field} already exists`);

    case "P2025": // Record not found
      return AppError.notFound("Resource not found");

    case "P2003": // Foreign key constraint violation
      return AppError.badRequest("Invalid reference to related resource");

    case "P2014": // Invalid ID
      return AppError.badRequest("Invalid ID provided");

    case "P2021": // Table does not exist
    case "P2022": // Column does not exist
      return AppError.internal("Database schema error");

    default:
      return AppError.internal("Database operation failed");
  }
}

/**
 * Async error wrapper - catches async errors and passes them to error handler
 */
export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<any>
) {
  return (req: T, res: U, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const error = AppError.notFound(`Route ${req.method} ${req.path} not found`);
  next(error);
}

/**
 * Graceful shutdown handler
 */
export function gracefulShutdown(server: any): void {
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
