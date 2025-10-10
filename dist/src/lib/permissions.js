"use strict";
// src/lib/permissions.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_PERMISSIONS = void 0;
exports.hasPermission = hasPermission;
exports.getRolePermissions = getRolePermissions;
exports.canAccessRole = canAccessRole;
exports.requirePermission = requirePermission;
exports.requireAnyPermission = requireAnyPermission;
exports.requireRole = requireRole;
exports.requireOwnershipOrPermission = requireOwnershipOrPermission;
exports.requireResourceAccess = requireResourceAccess;
exports.checkAdminSlots = checkAdminSlots;
exports.filterByRole = filterByRole;
exports.getUserPermissionContext = getUserPermissionContext;
const api_types_1 = require("../types/api.types");
/**
 * Role to permissions mapping
 * Each role inherits permissions from roles below it in hierarchy
 */
exports.ROLE_PERMISSIONS = {
    [api_types_1.Role.USER]: [
        api_types_1.Permission.READ_USER,
        api_types_1.Permission.READ_BLOG_POST,
        api_types_1.Permission.READ_EVENT,
    ],
    [api_types_1.Role.HACKER]: [
        api_types_1.Permission.READ_USER,
        api_types_1.Permission.READ_BLOG_POST,
        api_types_1.Permission.READ_EVENT,
    ],
    [api_types_1.Role.WRITER]: [
        api_types_1.Permission.READ_USER,
        api_types_1.Permission.READ_BLOG_POST,
        api_types_1.Permission.READ_EVENT,
        api_types_1.Permission.CREATE_BLOG_POST,
        api_types_1.Permission.UPDATE_BLOG_POST,
        api_types_1.Permission.DELETE_BLOG_POST,
    ],
    [api_types_1.Role.EVENT_ADMIN]: [
        api_types_1.Permission.READ_USER,
        api_types_1.Permission.READ_BLOG_POST,
        api_types_1.Permission.READ_EVENT,
        api_types_1.Permission.CREATE_EVENT,
        api_types_1.Permission.UPDATE_EVENT,
        api_types_1.Permission.DELETE_EVENT,
    ],
    [api_types_1.Role.ADMIN]: [
        api_types_1.Permission.READ_USER,
        api_types_1.Permission.CREATE_USER,
        api_types_1.Permission.UPDATE_USER,
        api_types_1.Permission.DELETE_USER,
        api_types_1.Permission.READ_BLOG_POST,
        api_types_1.Permission.CREATE_BLOG_POST,
        api_types_1.Permission.UPDATE_BLOG_POST,
        api_types_1.Permission.DELETE_BLOG_POST,
        api_types_1.Permission.READ_EVENT,
        api_types_1.Permission.CREATE_EVENT,
        api_types_1.Permission.UPDATE_EVENT,
        api_types_1.Permission.DELETE_EVENT,
        api_types_1.Permission.MANAGE_ROLES,
        api_types_1.Permission.VIEW_ANALYTICS,
    ],
    [api_types_1.Role.SUPERADMIN]: [
        // Superadmin has all permissions
        ...Object.values(api_types_1.Permission),
    ],
};
/**
 * Check if a role has a specific permission
 */
function hasPermission(role, permission) {
    const rolePermissions = exports.ROLE_PERMISSIONS[role] || [];
    return rolePermissions.includes(permission);
}
/**
 * Get all permissions for a role
 */
function getRolePermissions(role) {
    return exports.ROLE_PERMISSIONS[role] || [];
}
/**
 * Check if a role can access another role's resources
 */
function canAccessRole(userRole, targetRole) {
    const hierarchy = {
        [api_types_1.Role.USER]: 1,
        [api_types_1.Role.HACKER]: 1,
        [api_types_1.Role.WRITER]: 2,
        [api_types_1.Role.EVENT_ADMIN]: 2,
        [api_types_1.Role.ADMIN]: 3,
        [api_types_1.Role.SUPERADMIN]: 4,
    };
    return (hierarchy[userRole] || 0) >= (hierarchy[targetRole] || 0);
}
const client_1 = __importDefault(require("../../prisma/client"));
const errorHandler_1 = require("../middlewares/errorHandler");
const error_1 = require("./error");
/**
 * Middleware to check if user has required permission
 */
function requirePermission(permission) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            throw error_1.AppError.unauthorized("Authentication required");
        }
        if (!hasPermission(req.user.role, permission)) {
            throw error_1.AppError.forbidden(`Insufficient permissions. Required: ${permission}`);
        }
        next();
    }));
}
/**
 * Middleware to check if user has any of the required permissions
 */
function requireAnyPermission(permissions) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            throw error_1.AppError.unauthorized("Authentication required");
        }
        const hasAnyPermission = permissions.some((permission) => hasPermission(req.user.role, permission));
        if (!hasAnyPermission) {
            throw error_1.AppError.forbidden(`Insufficient permissions. Required any of: ${permissions.join(", ")}`);
        }
        next();
    }));
}
/**
 * Middleware to check if user has required role
 */
function requireRole(role) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            throw error_1.AppError.unauthorized("Authentication required");
        }
        const requiredRoles = Array.isArray(role) ? role : [role];
        if (!requiredRoles.includes(req.user.role)) {
            throw error_1.AppError.forbidden(`Insufficient role. Required: ${requiredRoles.join(" or ")}`);
        }
        next();
    }));
}
/**
 * Middleware to check if user can access the resource (ownership or permission)
 */
function requireOwnershipOrPermission(permission, options) {
    const { userIdField = "id", allowSameUser = true } = options || {};
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            throw error_1.AppError.unauthorized("Authentication required");
        }
        // Check if user has the required permission
        if (hasPermission(req.user.role, permission)) {
            return next();
        }
        // Check ownership if same user access is allowed
        if (allowSameUser) {
            const resourceUserId = req.params[userIdField];
            if (resourceUserId && parseInt(resourceUserId) === req.user.id) {
                return next();
            }
        }
        throw error_1.AppError.forbidden("Access denied. Insufficient permissions or ownership.");
    }));
}
/**
 * Enhanced permission middleware with resource-specific checks
 */
function requireResourceAccess(options) {
    const { permission, resourceType, allowOwnership = true, ownershipField = "id", } = options;
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (!req.user) {
            throw error_1.AppError.unauthorized("Authentication required");
        }
        // Check if user has the required permission
        if (hasPermission(req.user.role, permission)) {
            return next();
        }
        // If ownership check is enabled, verify resource ownership
        if (allowOwnership) {
            const resourceId = req.params[ownershipField];
            if (!resourceId) {
                throw error_1.AppError.badRequest("Resource ID not provided");
            }
            const isOwner = yield checkResourceOwnership(req.user, resourceType, parseInt(resourceId));
            if (isOwner) {
                return next();
            }
        }
        throw error_1.AppError.forbidden("Access denied. Insufficient permissions.");
    }));
}
/**
 * Check if user owns a specific resource
 */
function checkResourceOwnership(user, resourceType, resourceId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            switch (resourceType) {
                case "user":
                    return user.id === resourceId;
                case "event":
                    const event = yield client_1.default.event.findUnique({
                        where: { id: resourceId },
                        select: { host_id: true },
                    });
                    return (event === null || event === void 0 ? void 0 : event.host_id) === user.id;
                case "blog_post":
                    const blogPost = yield client_1.default.blogPost.findFirst({
                        where: {
                            id: resourceId,
                            authors: {
                                some: {
                                    author: {
                                        name: `${user.firstName} ${user.lastName}`, // Simplified check
                                    },
                                },
                            },
                        },
                    });
                    return !!blogPost;
                default:
                    return false;
            }
        }
        catch (error) {
            console.error("Error checking resource ownership:", error);
            return false;
        }
    });
}
/**
 * Middleware to ensure admin slots are not exceeded
 */
function checkAdminSlots(maxSlots = 3) {
    return (0, errorHandler_1.asyncHandler)((req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const adminCount = yield client_1.default.user.count({
            where: {
                roles: {
                    role: {
                        in: [api_types_1.Role.ADMIN, api_types_1.Role.SUPERADMIN],
                    },
                },
            },
        });
        if (adminCount >= maxSlots) {
            throw error_1.AppError.adminSlotsFilled();
        }
        next();
    }));
}
/**
 * Middleware for role-based data filtering
 */
function filterByRole() {
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        // Add role-based filtering to query
        const originalQuery = req.query;
        // For non-admin users, filter to only show public or own resources
        if (![api_types_1.Role.ADMIN, api_types_1.Role.SUPERADMIN].includes(req.user.role)) {
            req.query = Object.assign(Object.assign({}, originalQuery), { _userRole: req.user.role, _userId: req.user.id.toString() });
        }
        next();
    };
}
/**
 * Utility function to get user permissions for frontend
 */
function getUserPermissionContext(user) {
    return {
        role: user.role,
        permissions: getRolePermissions(user.role),
        canManageUsers: hasPermission(user.role, api_types_1.Permission.DELETE_USER),
        canCreateContent: hasPermission(user.role, api_types_1.Permission.CREATE_BLOG_POST),
        canManageEvents: hasPermission(user.role, api_types_1.Permission.CREATE_EVENT),
        isAdmin: [api_types_1.Role.ADMIN, api_types_1.Role.SUPERADMIN].includes(user.role),
    };
}
