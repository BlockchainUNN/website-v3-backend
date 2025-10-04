// src/lib/permissions.ts

import { Role, Permission } from "../types/api.types";

/**
 * Role to permissions mapping
 * Each role inherits permissions from roles below it in hierarchy
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.USER]: [
    Permission.READ_USER,
    Permission.READ_BLOG_POST,
    Permission.READ_EVENT,
  ],

  [Role.HACKER]: [
    Permission.READ_USER,
    Permission.READ_BLOG_POST,
    Permission.READ_EVENT,
  ],

  [Role.WRITER]: [
    Permission.READ_USER,
    Permission.READ_BLOG_POST,
    Permission.READ_EVENT,
    Permission.CREATE_BLOG_POST,
    Permission.UPDATE_BLOG_POST,
    Permission.DELETE_BLOG_POST,
  ],

  [Role.EVENT_ADMIN]: [
    Permission.READ_USER,
    Permission.READ_BLOG_POST,
    Permission.READ_EVENT,
    Permission.CREATE_EVENT,
    Permission.UPDATE_EVENT,
    Permission.DELETE_EVENT,
  ],

  [Role.ADMIN]: [
    Permission.READ_USER,
    Permission.CREATE_USER,
    Permission.UPDATE_USER,
    Permission.DELETE_USER,
    Permission.READ_BLOG_POST,
    Permission.CREATE_BLOG_POST,
    Permission.UPDATE_BLOG_POST,
    Permission.DELETE_BLOG_POST,
    Permission.READ_EVENT,
    Permission.CREATE_EVENT,
    Permission.UPDATE_EVENT,
    Permission.DELETE_EVENT,
    Permission.MANAGE_ROLES,
    Permission.VIEW_ANALYTICS,
  ],

  [Role.SUPERADMIN]: [
    // Superadmin has all permissions
    ...Object.values(Permission),
  ],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can access another role's resources
 */
export function canAccessRole(userRole: Role, targetRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    [Role.USER]: 1,
    [Role.HACKER]: 1,
    [Role.WRITER]: 2,
    [Role.EVENT_ADMIN]: 2,
    [Role.ADMIN]: 3,
    [Role.SUPERADMIN]: 4,
  };

  return (hierarchy[userRole] || 0) >= (hierarchy[targetRole] || 0);
}

// src/middleware/rbac.ts

import { NextFunction, Request, Response } from "express";
import { AuthenticatedUser } from "../types/api.types";
import prisma from "../../prisma/client";
import { asyncHandler } from "../middlewares/errorHandler";
import { AppError } from "./error";

/**
 * Middleware to check if user has required permission
 */
export function requirePermission(permission: Permission) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      if (!hasPermission(req.user.role, permission)) {
        throw AppError.forbidden(
          `Insufficient permissions. Required: ${permission}`
        );
      }

      next();
    }
  );
}

/**
 * Middleware to check if user has any of the required permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      const hasAnyPermission = permissions.some((permission) =>
        hasPermission(req.user!.role, permission)
      );

      if (!hasAnyPermission) {
        throw AppError.forbidden(
          `Insufficient permissions. Required any of: ${permissions.join(", ")}`
        );
      }

      next();
    }
  );
}

/**
 * Middleware to check if user has required role
 */
export function requireRole(role: Role | Role[]) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      const requiredRoles = Array.isArray(role) ? role : [role];

      if (!requiredRoles.includes(req.user.role)) {
        throw AppError.forbidden(
          `Insufficient role. Required: ${requiredRoles.join(" or ")}`
        );
      }

      next();
    }
  );
}

/**
 * Middleware to check if user can access the resource (ownership or permission)
 */
export function requireOwnershipOrPermission(
  permission: Permission,
  options?: {
    userIdField?: string;
    allowSameUser?: boolean;
  }
) {
  const { userIdField = "id", allowSameUser = true } = options || {};

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
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

      throw AppError.forbidden(
        "Access denied. Insufficient permissions or ownership."
      );
    }
  );
}

/**
 * Enhanced permission middleware with resource-specific checks
 */
export function requireResourceAccess(options: {
  permission: Permission;
  resourceType: "user" | "event" | "blog_post" | "blog_author";
  allowOwnership?: boolean;
  ownershipField?: string;
}) {
  const {
    permission,
    resourceType,
    allowOwnership = true,
    ownershipField = "id",
  } = options;

  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw AppError.unauthorized("Authentication required");
      }

      // Check if user has the required permission
      if (hasPermission(req.user.role, permission)) {
        return next();
      }

      // If ownership check is enabled, verify resource ownership
      if (allowOwnership) {
        const resourceId = req.params[ownershipField];

        if (!resourceId) {
          throw AppError.badRequest("Resource ID not provided");
        }

        const isOwner = await checkResourceOwnership(
          req.user,
          resourceType,
          parseInt(resourceId)
        );

        if (isOwner) {
          return next();
        }
      }

      throw AppError.forbidden("Access denied. Insufficient permissions.");
    }
  );
}

/**
 * Check if user owns a specific resource
 */
async function checkResourceOwnership(
  user: AuthenticatedUser,
  resourceType: string,
  resourceId: number
): Promise<boolean> {
  try {
    switch (resourceType) {
      case "user":
        return user.id === resourceId;

      case "event":
        const event = await prisma.event.findUnique({
          where: { id: resourceId },
          select: { host_id: true },
        });
        return event?.host_id === user.id;

      case "blog_post":
        const blogPost = await prisma.blogPost.findFirst({
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
  } catch (error) {
    console.error("Error checking resource ownership:", error);
    return false;
  }
}

/**
 * Middleware to ensure admin slots are not exceeded
 */
export function checkAdminSlots(maxSlots: number = 3) {
  return asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const adminCount = await prisma.user.count({
        where: {
          roles: {
            role: {
              in: [Role.ADMIN, Role.SUPERADMIN],
            },
          },
        },
      });

      if (adminCount >= maxSlots) {
        throw AppError.adminSlotsFilled();
      }

      next();
    }
  );
}

/**
 * Middleware for role-based data filtering
 */
export function filterByRole() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next();
    }

    // Add role-based filtering to query
    const originalQuery = req.query;

    // For non-admin users, filter to only show public or own resources
    if (![Role.ADMIN, Role.SUPERADMIN].includes(req.user.role)) {
      req.query = {
        ...originalQuery,
        _userRole: req.user.role,
        _userId: req.user.id.toString(),
      };
    }

    next();
  };
}

/**
 * Utility function to get user permissions for frontend
 */
export function getUserPermissionContext(user: AuthenticatedUser) {
  return {
    role: user.role,
    permissions: getRolePermissions(user.role),
    canManageUsers: hasPermission(user.role, Permission.DELETE_USER),
    canCreateContent: hasPermission(user.role, Permission.CREATE_BLOG_POST),
    canManageEvents: hasPermission(user.role, Permission.CREATE_EVENT),
    isAdmin: [Role.ADMIN, Role.SUPERADMIN].includes(user.role),
  };
}
