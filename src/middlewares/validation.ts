// src/middleware/validation.ts

import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodObject } from "zod";
import { asyncHandler } from "./errorHandler";
import { AppError } from "../lib/error";

/**
 * Generic validation middleware factory
 */
export function validate<T extends z.ZodTypeAny>(schema: T) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        let validated: unknown;

        // If schema is an object schema with keys like body/params/query/files
        if (schema instanceof ZodObject) {
          const shapeKeys = Object.keys(schema.shape);
          const dataToValidate: Record<string, unknown> = {};

          if (shapeKeys.includes("body")) {
            dataToValidate.body = req.body;
          }

          if (shapeKeys.includes("params")) {
            dataToValidate.params = req.params;
          }

          if (shapeKeys.includes("query")) {
            dataToValidate.query = req.query;
          }

          if (shapeKeys.includes("files")) {
            if (req.file) {
              dataToValidate.files = { [req.file.fieldname]: req.file };
            } else if (req.files) {
              if (Array.isArray(req.files)) {
                dataToValidate.files = req.files.reduce<
                  Record<string, unknown>
                >((acc, file) => {
                  acc[file.fieldname] = file;
                  return acc;
                }, {});
              } else {
                dataToValidate.files = req.files;
              }
            }
          }

          validated = schema.parse(dataToValidate);

          // Assign validated parts back
          const v = validated as Record<string, unknown>;
          if (v.body) req.body = v.body;
          if (v.params) req.params = v.params as Record<string, string>;
          if (v.query) req.query = v.query as Record<string, string | string[]>;
          if (v.files) (req as any).files = v.files; // extend req if needed
        } else {
          // Otherwise validate req.body directly
          validated = schema.parse(req.body);
          req.body = validated;
        }

        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const formattedErrors = (error as any)?.errors?.map(
            (err: { path: any[]; message: any; input: any }) => ({
              field: err.path.join("."),
              message: err.message,
              value: err.input,
            })
          );

          throw AppError.badRequest("Validation failed", {
            errors: formattedErrors,
            invalidFields: (error as any)?.errors?.length,
          });
        }
        throw error;
      }
    }
  );
}

/**
 * Specialized validation for multipart form data
 */
export function validateMultipart<T extends z.ZodSchema>(schema: T) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse JSON fields in multipart form data
        const parsedBody: any = {};

        for (const [key, value] of Object.entries(req.body)) {
          try {
            // Try to parse as JSON first
            parsedBody[key] = JSON.parse(value as string);
          } catch {
            // If not JSON, keep as string
            parsedBody[key] = value;
          }
        }

        req.body = parsedBody;

        // Use regular validation
        return validate(schema)(req, res, next);
      } catch (error) {
        throw error;
      }
    }
  );
}

/**
 * File upload validation middleware
 */
export function validateFileUpload(options: {
  allowedMimeTypes?: string[];
  maxFileSize?: number; // in bytes
  required?: boolean;
  fieldName?: string;
}) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const {
        allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"],
        maxFileSize = 5 * 1024 * 1024, // 5MB default
        required = false,
        fieldName = "file",
      } = options;

      const file = req.file;

      // Check if file is required
      if (required && !file) {
        throw AppError.badRequest(`${fieldName} is required`);
      }

      // If no file and not required, continue
      if (!file && !required) {
        return next();
      }

      if (file) {
        // Check file size
        if (file.size > maxFileSize) {
          throw AppError.fileUploadError(
            `File too large. Maximum size is ${Math.round(
              maxFileSize / 1024 / 1024
            )}MB`,
            { fileSize: file.size, maxSize: maxFileSize }
          );
        }

        // Check mime type
        if (!allowedMimeTypes.includes(file.mimetype)) {
          throw AppError.fileUploadError(
            `Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`,
            { fileType: file.mimetype, allowedTypes: allowedMimeTypes }
          );
        }
      }

      next();
    }
  );
}

/**
 * Sanitization middleware for common XSS prevention
 */
export function sanitizeInput() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Basic HTML tag removal and script injection prevention
    const sanitizeValue = (value: any): any => {
      if (typeof value === "string") {
        return value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]*>/g, "")
          .trim();
      }
      if (typeof value === "object" && value !== null) {
        const sanitized: any = Array.isArray(value) ? [] : {};
        for (const key in value) {
          sanitized[key] = sanitizeValue(value[key]);
        }
        return sanitized;
      }
      return value;
    };

    if (req.body) {
      req.body = sanitizeValue(req.body);
    }
    if (req.query) {
      req.query = sanitizeValue(req.query);
    }

    next();
  };
}

/**
 * Rate limiting validation for specific endpoints
 */
export function validateRateLimit(options: {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: Request) => string;
}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip || "unknown",
  } = options;

  const requests = new Map<string, { count: number; resetTime: number }>();

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const key = keyGenerator(req);
      const now = Date.now();

      let clientRequests = requests.get(key);

      if (!clientRequests || now > clientRequests.resetTime) {
        clientRequests = {
          count: 1,
          resetTime: now + windowMs,
        };
        requests.set(key, clientRequests);
      } else {
        clientRequests.count++;
      }

      if (clientRequests.count > maxRequests) {
        throw AppError.badRequest("Too many requests", {
          retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000),
        });
      }

      // Add rate limit headers
      res.setHeader("X-RateLimit-Limit", maxRequests.toString());
      res.setHeader(
        "X-RateLimit-Remaining",
        (maxRequests - clientRequests.count).toString()
      );
      res.setHeader("X-RateLimit-Reset", clientRequests.resetTime.toString());

      next();
    }
  );
}
