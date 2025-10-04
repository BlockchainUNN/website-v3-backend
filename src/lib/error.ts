// src/lib/errors.ts

import { ErrorCode } from "../types/api.types";

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly publicMessage: string;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    status: number,
    publicMessage: string,
    details?: any,
    isOperational = true
  ) {
    super(publicMessage);

    this.code = code;
    this.status = status;
    this.publicMessage = publicMessage;
    this.details = details;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message: string, details?: any): AppError {
    return new AppError(ErrorCode.VALIDATION_ERROR, 400, message, details);
  }

  static unauthorized(
    message: string = "Authentication required",
    details?: any
  ): AppError {
    return new AppError(
      ErrorCode.AUTHENTICATION_REQUIRED,
      401,
      message,
      details
    );
  }

  static forbidden(
    message: string = "Insufficient permissions",
    details?: any
  ): AppError {
    return new AppError(ErrorCode.FORBIDDEN, 403, message, details);
  }

  static notFound(
    message: string = "Resource not found",
    details?: any
  ): AppError {
    return new AppError(ErrorCode.NOT_FOUND, 404, message, details);
  }

  static conflict(message: string, details?: any): AppError {
    return new AppError(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      409,
      message,
      details
    );
  }

  static internal(
    message: string = "Internal server error",
    details?: any
  ): AppError {
    return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, 500, message, details);
  }

  // Specific error factory methods
  static userNotFound(userId?: string | number): AppError {
    return new AppError(
      ErrorCode.USER_NOT_FOUND,
      404,
      "User not found",
      userId ? { userId } : undefined
    );
  }

  static emailAlreadyExists(email: string): AppError {
    return new AppError(
      ErrorCode.EMAIL_ALREADY_EXISTS,
      409,
      "Email address is already in use",
      { email }
    );
  }

  static invalidCredentials(): AppError {
    return new AppError(
      ErrorCode.INVALID_CREDENTIALS,
      401,
      "Invalid email or password"
    );
  }

  static eventNotFound(eventId?: string | number): AppError {
    return new AppError(
      ErrorCode.EVENT_NOT_FOUND,
      404,
      "Event not found",
      eventId ? { eventId } : undefined
    );
  }

  static blogPostNotFound(postId?: string | number): AppError {
    return new AppError(
      ErrorCode.BLOG_POST_NOT_FOUND,
      404,
      "Blog post not found",
      postId ? { postId } : undefined
    );
  }

  static adminSlotsFilled(): AppError {
    return new AppError(
      ErrorCode.ADMIN_SLOTS_FILLED,
      403,
      "Maximum number of administrators reached"
    );
  }

  static fileUploadError(
    message: string = "File upload failed",
    details?: any
  ): AppError {
    return new AppError(ErrorCode.FILE_UPLOAD_ERROR, 400, message, details);
  }

  static eventFull(): AppError {
    return new AppError(
      ErrorCode.EVENT_FULL,
      409,
      "Event has reached maximum capacity"
    );
  }

  static registrationClosed(): AppError {
    return new AppError(
      ErrorCode.REGISTRATION_CLOSED,
      410,
      "Registration period has ended"
    );
  }
}

// Error code to HTTP status mapping (for consistency)
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.AUTHENTICATION_REQUIRED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_CREDENTIALS]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.TOKEN_INVALID]: 401,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.USER_NOT_FOUND]: 404,
  [ErrorCode.EVENT_NOT_FOUND]: 404,
  [ErrorCode.BLOG_POST_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 409,
  [ErrorCode.USER_ALREADY_EXISTS]: 409,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
  [ErrorCode.ADMIN_SLOTS_FILLED]: 403,
  [ErrorCode.INVALID_OPERATION]: 400,
  [ErrorCode.REGISTRATION_CLOSED]: 410,
  [ErrorCode.EVENT_FULL]: 409,
  [ErrorCode.FILE_UPLOAD_ERROR]: 400,
  [ErrorCode.INVALID_FILE_TYPE]: 400,
  [ErrorCode.FILE_TOO_LARGE]: 413,
};

// Utility function to check if error is operational
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}
