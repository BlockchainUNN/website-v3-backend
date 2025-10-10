"use strict";
// src/middleware/validation.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
exports.validateMultipart = validateMultipart;
exports.validateFileUpload = validateFileUpload;
exports.sanitizeInput = sanitizeInput;
exports.validateRateLimit = validateRateLimit;
const zod_1 = require("zod");
const errorHandler_1 = require("./errorHandler");
const error_1 = require("../lib/error");
/**
 * Generic validation middleware factory
 */
function validate(schema) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            let validated;
            // If schema is an object schema with keys like body/params/query/files
            if (schema instanceof zod_1.ZodObject) {
                const shapeKeys = Object.keys(schema.shape);
                const dataToValidate = {};
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
                    }
                    else if (req.files) {
                        if (Array.isArray(req.files)) {
                            dataToValidate.files = req.files.reduce((acc, file) => {
                                acc[file.fieldname] = file;
                                return acc;
                            }, {});
                        }
                        else {
                            dataToValidate.files = req.files;
                        }
                    }
                }
                validated = schema.parse(dataToValidate);
                // Assign validated parts back
                const v = validated;
                if (v.body)
                    req.body = v.body;
                if (v.params)
                    req.params = v.params;
                if (v.query)
                    req.query = v.query;
                if (v.files)
                    req.files = v.files; // extend req if needed
            }
            else {
                // Otherwise validate req.body directly
                validated = schema.parse(req.body);
                req.body = validated;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                const formattedErrors = (_a = error === null || error === void 0 ? void 0 : error.errors) === null || _a === void 0 ? void 0 : _a.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                    value: err.input,
                }));
                throw error_1.AppError.badRequest("Validation failed", {
                    errors: formattedErrors,
                    invalidFields: (_b = error === null || error === void 0 ? void 0 : error.errors) === null || _b === void 0 ? void 0 : _b.length,
                });
            }
            throw error;
        }
    }));
}
/**
 * Specialized validation for multipart form data
 */
function validateMultipart(schema) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        try {
            // Parse JSON fields in multipart form data
            const parsedBody = {};
            for (const [key, value] of Object.entries(req.body)) {
                try {
                    // Try to parse as JSON first
                    parsedBody[key] = JSON.parse(value);
                }
                catch (_a) {
                    // If not JSON, keep as string
                    parsedBody[key] = value;
                }
            }
            req.body = parsedBody;
            // Use regular validation
            return validate(schema)(req, res, next);
        }
        catch (error) {
            throw error;
        }
    }));
}
/**
 * File upload validation middleware
 */
function validateFileUpload(options) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const { allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"], maxFileSize = 5 * 1024 * 1024, // 5MB default
        required = false, fieldName = "file", } = options;
        const file = req.file;
        // Check if file is required
        if (required && !file) {
            throw error_1.AppError.badRequest(`${fieldName} is required`);
        }
        // If no file and not required, continue
        if (!file && !required) {
            return next();
        }
        if (file) {
            // Check file size
            if (file.size > maxFileSize) {
                throw error_1.AppError.fileUploadError(`File too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB`, { fileSize: file.size, maxSize: maxFileSize });
            }
            // Check mime type
            if (!allowedMimeTypes.includes(file.mimetype)) {
                throw error_1.AppError.fileUploadError(`Invalid file type. Allowed types: ${allowedMimeTypes.join(", ")}`, { fileType: file.mimetype, allowedTypes: allowedMimeTypes });
            }
        }
        next();
    }));
}
/**
 * Sanitization middleware for common XSS prevention
 */
function sanitizeInput() {
    return (req, res, next) => {
        // Basic HTML tag removal and script injection prevention
        const sanitizeValue = (value) => {
            if (typeof value === "string") {
                return value
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/<[^>]*>/g, "")
                    .trim();
            }
            if (typeof value === "object" && value !== null) {
                const sanitized = Array.isArray(value) ? [] : {};
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
function validateRateLimit(options) {
    const { windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100, keyGenerator = (req) => req.ip || "unknown", } = options;
    const requests = new Map();
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const key = keyGenerator(req);
        const now = Date.now();
        let clientRequests = requests.get(key);
        if (!clientRequests || now > clientRequests.resetTime) {
            clientRequests = {
                count: 1,
                resetTime: now + windowMs,
            };
            requests.set(key, clientRequests);
        }
        else {
            clientRequests.count++;
        }
        if (clientRequests.count > maxRequests) {
            throw error_1.AppError.badRequest("Too many requests", {
                retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000),
            });
        }
        // Add rate limit headers
        res.setHeader("X-RateLimit-Limit", maxRequests.toString());
        res.setHeader("X-RateLimit-Remaining", (maxRequests - clientRequests.count).toString());
        res.setHeader("X-RateLimit-Reset", clientRequests.resetTime.toString());
        next();
    }));
}
