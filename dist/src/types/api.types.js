"use strict";
// src/types/api.types.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.Permission = exports.Role = exports.ErrorCode = void 0;
var ErrorCode;
(function (ErrorCode) {
    // General errors
    ErrorCode["INTERNAL_SERVER_ERROR"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["VALIDATION_ERROR"] = "VALIDATION_ERROR";
    // Authentication & Authorization
    ErrorCode["AUTHENTICATION_REQUIRED"] = "AUTHENTICATION_REQUIRED";
    ErrorCode["FORBIDDEN"] = "FORBIDDEN";
    ErrorCode["INVALID_CREDENTIALS"] = "INVALID_CREDENTIALS";
    ErrorCode["TOKEN_EXPIRED"] = "TOKEN_EXPIRED";
    ErrorCode["TOKEN_INVALID"] = "TOKEN_INVALID";
    // Resource errors
    ErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ErrorCode["RESOURCE_NOT_FOUND"] = "RESOURCE_NOT_FOUND";
    ErrorCode["USER_NOT_FOUND"] = "USER_NOT_FOUND";
    ErrorCode["EVENT_NOT_FOUND"] = "EVENT_NOT_FOUND";
    ErrorCode["BLOG_POST_NOT_FOUND"] = "BLOG_POST_NOT_FOUND";
    // Conflict errors
    ErrorCode["RESOURCE_ALREADY_EXISTS"] = "RESOURCE_ALREADY_EXISTS";
    ErrorCode["EMAIL_ALREADY_EXISTS"] = "EMAIL_ALREADY_EXISTS";
    ErrorCode["USER_ALREADY_EXISTS"] = "USER_ALREADY_EXISTS";
    // Permission errors
    ErrorCode["INSUFFICIENT_PERMISSIONS"] = "INSUFFICIENT_PERMISSIONS";
    ErrorCode["ADMIN_SLOTS_FILLED"] = "ADMIN_SLOTS_FILLED";
    // Business logic errors
    ErrorCode["INVALID_OPERATION"] = "INVALID_OPERATION";
    ErrorCode["REGISTRATION_CLOSED"] = "REGISTRATION_CLOSED";
    ErrorCode["EVENT_FULL"] = "EVENT_FULL";
    // File upload errors
    ErrorCode["FILE_UPLOAD_ERROR"] = "FILE_UPLOAD_ERROR";
    ErrorCode["INVALID_FILE_TYPE"] = "INVALID_FILE_TYPE";
    ErrorCode["FILE_TOO_LARGE"] = "FILE_TOO_LARGE";
})(ErrorCode || (exports.ErrorCode = ErrorCode = {}));
// Role and Permission types
var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["SUPERADMIN"] = "superadmin";
    Role["USER"] = "user";
    Role["WRITER"] = "writer";
    Role["EVENT_ADMIN"] = "event_admin";
    Role["HACKER"] = "hacker";
})(Role || (exports.Role = Role = {}));
var Permission;
(function (Permission) {
    // User permissions
    Permission["CREATE_USER"] = "CREATE_USER";
    Permission["READ_USER"] = "READ_USER";
    Permission["UPDATE_USER"] = "UPDATE_USER";
    Permission["DELETE_USER"] = "DELETE_USER";
    // Blog permissions
    Permission["CREATE_BLOG_POST"] = "CREATE_BLOG_POST";
    Permission["READ_BLOG_POST"] = "READ_BLOG_POST";
    Permission["UPDATE_BLOG_POST"] = "UPDATE_BLOG_POST";
    Permission["DELETE_BLOG_POST"] = "DELETE_BLOG_POST";
    // Event permissions
    Permission["CREATE_EVENT"] = "CREATE_EVENT";
    Permission["READ_EVENT"] = "READ_EVENT";
    Permission["UPDATE_EVENT"] = "UPDATE_EVENT";
    Permission["DELETE_EVENT"] = "DELETE_EVENT";
    // Admin permissions
    Permission["MANAGE_ROLES"] = "MANAGE_ROLES";
    Permission["MANAGE_PERMISSIONS"] = "MANAGE_PERMISSIONS";
    Permission["VIEW_ANALYTICS"] = "VIEW_ANALYTICS";
})(Permission || (exports.Permission = Permission = {}));
