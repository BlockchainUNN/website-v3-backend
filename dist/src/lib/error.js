"use strict";
// src/lib/errors.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_STATUS_MAP = exports.AppError = void 0;
exports.isOperationalError = isOperationalError;
const api_types_1 = require("../types/api.types");
class AppError extends Error {
    constructor(code, status, publicMessage, details, isOperational = true) {
        super(publicMessage);
        this.code = code;
        this.status = status;
        this.publicMessage = publicMessage;
        this.details = details;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
    static badRequest(message, details) {
        return new AppError(api_types_1.ErrorCode.VALIDATION_ERROR, 400, message, details);
    }
    static unauthorized(message = "Authentication required", details) {
        return new AppError(api_types_1.ErrorCode.AUTHENTICATION_REQUIRED, 401, message, details);
    }
    static forbidden(message = "Insufficient permissions", details) {
        return new AppError(api_types_1.ErrorCode.FORBIDDEN, 403, message, details);
    }
    static notFound(message = "Resource not found", details) {
        return new AppError(api_types_1.ErrorCode.NOT_FOUND, 404, message, details);
    }
    static conflict(message, details) {
        return new AppError(api_types_1.ErrorCode.RESOURCE_ALREADY_EXISTS, 409, message, details);
    }
    static internal(message = "Internal server error", details) {
        return new AppError(api_types_1.ErrorCode.INTERNAL_SERVER_ERROR, 500, message, details);
    }
    // Specific error factory methods
    static userNotFound(userId) {
        return new AppError(api_types_1.ErrorCode.USER_NOT_FOUND, 404, "User not found", userId ? { userId } : undefined);
    }
    static emailAlreadyExists(email) {
        return new AppError(api_types_1.ErrorCode.EMAIL_ALREADY_EXISTS, 409, "Email address is already in use", { email });
    }
    static invalidCredentials() {
        return new AppError(api_types_1.ErrorCode.INVALID_CREDENTIALS, 401, "Invalid email or password");
    }
    static eventNotFound(eventId) {
        return new AppError(api_types_1.ErrorCode.EVENT_NOT_FOUND, 404, "Event not found", eventId ? { eventId } : undefined);
    }
    static blogPostNotFound(postId) {
        return new AppError(api_types_1.ErrorCode.BLOG_POST_NOT_FOUND, 404, "Blog post not found", postId ? { postId } : undefined);
    }
    static adminSlotsFilled() {
        return new AppError(api_types_1.ErrorCode.ADMIN_SLOTS_FILLED, 403, "Maximum number of administrators reached");
    }
    static fileUploadError(message = "File upload failed", details) {
        return new AppError(api_types_1.ErrorCode.FILE_UPLOAD_ERROR, 400, message, details);
    }
    static eventFull() {
        return new AppError(api_types_1.ErrorCode.EVENT_FULL, 409, "Event has reached maximum capacity");
    }
    static registrationClosed() {
        return new AppError(api_types_1.ErrorCode.REGISTRATION_CLOSED, 410, "Registration period has ended");
    }
}
exports.AppError = AppError;
// Error code to HTTP status mapping (for consistency)
exports.ERROR_STATUS_MAP = {
    [api_types_1.ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [api_types_1.ErrorCode.VALIDATION_ERROR]: 400,
    [api_types_1.ErrorCode.AUTHENTICATION_REQUIRED]: 401,
    [api_types_1.ErrorCode.FORBIDDEN]: 403,
    [api_types_1.ErrorCode.INVALID_CREDENTIALS]: 401,
    [api_types_1.ErrorCode.TOKEN_EXPIRED]: 401,
    [api_types_1.ErrorCode.TOKEN_INVALID]: 401,
    [api_types_1.ErrorCode.NOT_FOUND]: 404,
    [api_types_1.ErrorCode.RESOURCE_NOT_FOUND]: 404,
    [api_types_1.ErrorCode.USER_NOT_FOUND]: 404,
    [api_types_1.ErrorCode.EVENT_NOT_FOUND]: 404,
    [api_types_1.ErrorCode.BLOG_POST_NOT_FOUND]: 404,
    [api_types_1.ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
    [api_types_1.ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
    [api_types_1.ErrorCode.USER_ALREADY_EXISTS]: 409,
    [api_types_1.ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
    [api_types_1.ErrorCode.ADMIN_SLOTS_FILLED]: 403,
    [api_types_1.ErrorCode.INVALID_OPERATION]: 400,
    [api_types_1.ErrorCode.REGISTRATION_CLOSED]: 410,
    [api_types_1.ErrorCode.EVENT_FULL]: 409,
    [api_types_1.ErrorCode.FILE_UPLOAD_ERROR]: 400,
    [api_types_1.ErrorCode.INVALID_FILE_TYPE]: 400,
    [api_types_1.ErrorCode.FILE_TOO_LARGE]: 413,
};
// Utility function to check if error is operational
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}
