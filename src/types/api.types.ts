// src/types/api.types.ts

export enum ErrorCode {
  // General errors
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",

  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  FORBIDDEN = "FORBIDDEN",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",

  // Resource errors
  NOT_FOUND = "NOT_FOUND",
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  EVENT_NOT_FOUND = "EVENT_NOT_FOUND",
  BLOG_POST_NOT_FOUND = "BLOG_POST_NOT_FOUND",

  // Conflict errors
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  USER_ALREADY_EXISTS = "USER_ALREADY_EXISTS",

  // Permission errors
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",
  ADMIN_SLOTS_FILLED = "ADMIN_SLOTS_FILLED",

  // Business logic errors
  INVALID_OPERATION = "INVALID_OPERATION",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  EVENT_FULL = "EVENT_FULL",

  // File upload errors
  FILE_UPLOAD_ERROR = "FILE_UPLOAD_ERROR",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
}

export type ApiError = {
  code: ErrorCode;
  status: number;
  message: string;
  detail?: string | Record<string, any>;
};

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T | null;
  error?: ApiError | null;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: PaginationMeta;
}>;

// Role and Permission types
export enum Role {
  ADMIN = "admin",
  SUPERADMIN = "superadmin",
  USER = "user",
  WRITER = "writer",
  EVENT_ADMIN = "event_admin",
  HACKER = "hacker",
}

export enum Permission {
  // User permissions
  CREATE_USER = "CREATE_USER",
  READ_USER = "READ_USER",
  UPDATE_USER = "UPDATE_USER",
  DELETE_USER = "DELETE_USER",

  // Blog permissions
  CREATE_BLOG_POST = "CREATE_BLOG_POST",
  READ_BLOG_POST = "READ_BLOG_POST",
  UPDATE_BLOG_POST = "UPDATE_BLOG_POST",
  DELETE_BLOG_POST = "DELETE_BLOG_POST",

  // Event permissions
  CREATE_EVENT = "CREATE_EVENT",
  READ_EVENT = "READ_EVENT",
  UPDATE_EVENT = "UPDATE_EVENT",
  DELETE_EVENT = "DELETE_EVENT",

  // Admin permissions
  MANAGE_ROLES = "MANAGE_ROLES",
  MANAGE_PERMISSIONS = "MANAGE_PERMISSIONS",
  VIEW_ANALYTICS = "VIEW_ANALYTICS",
}

// User context type for authenticated requests
export interface AuthenticatedUser {
  id: number;
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  permissions: Permission[];
}
