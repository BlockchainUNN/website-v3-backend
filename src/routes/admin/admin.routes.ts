import { Router } from "express";
import { Permission } from "../../types/api.types";
import userController from "../../controllers/users/users.controllers";
import { successResponse } from "../../lib/response";
import prisma from "../../../prisma/client";
import {
  requirePermission,
  checkAdminSlots,
  getUserPermissionContext,
} from "../../lib/permissions";
import { authenticate } from "../../middlewares/auth";
import { asyncHandler } from "../../middlewares/errorHandler";
import { validate } from "../../middlewares/validation";
import { ParamIdSchema } from "../../schema/common.schema";
import { AdminRegistrationSchema } from "../../schema/user.schema";

const adminRoutes = Router();

/**
 * @swagger
 * /api/v3/admin/register:
 *   post:
 *     tags: [Admin Management]
 *     summary: Register new admin
 *     description: Create a new admin account. Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Jane"
 *               lastName:
 *                 type: string
 *                 example: "Admin"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "jane.admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecureP@ssw0rd!"
 *     responses:
 *       201:
 *         description: Admin created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Admin slots filled or insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
adminRoutes.post(
  "/admin/register",
  authenticate,
  requirePermission(Permission.MANAGE_ROLES),
  checkAdminSlots(3), // Maximum 3 admins
  validate(AdminRegistrationSchema),
  userController.registerAdmin
);

/**
 * @swagger
 * /api/v3/admin/users/{id}/assign-role:
 *   put:
 *     tags: [Admin Management]
 *     summary: Assign role to user
 *     description: Assign a specific role to a user. Admin or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, writer, event_admin, admin, superadmin]
 *                 example: "writer"
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     role:
 *                       type: string
 *                       example: "writer"
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["READ_BLOG_POST", "CREATE_BLOG_POST", "UPDATE_BLOG_POST"]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRoutes.put(
  "/admin/users/:id/assign-role",
  authenticate,
  requirePermission(Permission.MANAGE_ROLES),
  validate(ParamIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new Error("Invalid user ID");
    }

    // Validate role
    const validRoles = ["user", "writer", "event_admin", "admin", "superadmin"];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role");
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get or create role
    let userRole = await prisma.role.findUnique({
      where: { role },
    });

    if (!userRole) {
      userRole = await prisma.role.create({
        data: { role },
      });
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId: userRole.id },
      include: { roles: true },
    });

    // Get permissions for the new role
    const permissions = getUserPermissionContext({
      id: updatedUser.id,
      uid: updatedUser.uid,
      email: updatedUser.email,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      role: role as any,
      permissions: [],
    });

    const responseData = {
      userId: updatedUser.id,
      role: updatedUser.roles?.role,
      permissions: permissions.permissions,
    };

    return successResponse(
      res,
      responseData,
      200,
      "Role assigned successfully"
    );
  })
);

/**
 * @swagger
 * /api/v3/admin/analytics:
 *   get:
 *     tags: [Admin Management]
 *     summary: Get system analytics
 *     description: Retrieve system-wide analytics and statistics. Admin or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1250
 *                         byRole:
 *                           type: object
 *                           properties:
 *                             user:
 *                               type: integer
 *                               example: 1200
 *                             writer:
 *                               type: integer
 *                               example: 25
 *                             event_admin:
 *                               type: integer
 *                               example: 15
 *                             admin:
 *                               type: integer
 *                               example: 8
 *                             superadmin:
 *                               type: integer
 *                               example: 2
 *                         newThisMonth:
 *                           type: integer
 *                           example: 85
 *                     events:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 45
 *                         upcoming:
 *                           type: integer
 *                           example: 12
 *                         past:
 *                           type: integer
 *                           example: 33
 *                         totalAttendees:
 *                           type: integer
 *                           example: 3450
 *                     blog:
 *                       type: object
 *                       properties:
 *                         totalPosts:
 *                           type: integer
 *                           example: 127
 *                         totalAuthors:
 *                           type: integer
 *                           example: 18
 *                         postsThisMonth:
 *                           type: integer
 *                           example: 8
 *                     system:
 *                       type: object
 *                       properties:
 *                         version:
 *                           type: string
 *                           example: "1.0.0"
 *                         uptime:
 *                           type: string
 *                           example: "72h 15m"
 *                         environment:
 *                           type: string
 *                           example: "production"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRoutes.get(
  "/admin/analytics",
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  asyncHandler(async (req, res) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user statistics
    const [totalUsers, usersByRole, newUsersThisMonth] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ["roleId"],
        _count: { id: true },
      }),
      prisma.user.count({
        where: {
          created_at: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // Get role names
    const roles = await prisma.role.findMany();
    const roleMap = roles.reduce(
      (acc: { [x: string]: any }, role: { id: string | number; role: any }) => {
        acc[role.id] = role.role;
        return acc;
      },
      {} as Record<number, string>
    );

    const userRoleStats = usersByRole.reduce(
      (
        acc: { [x: string]: any },
        stat: { roleId: number | null; _count: { id: number } }
      ) => {
        // If roleId is null, treat as "user"
        const roleName = stat.roleId !== null ? roleMap[stat.roleId] : "user";
        acc[roleName] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get event statistics
    const [totalEvents, upcomingEvents, pastEvents, totalAttendees] =
      await Promise.all([
        prisma.event.count(),
        prisma.event.count({
          where: {
            start_date: {
              gte: now,
            },
          },
        }),
        prisma.event.count({
          where: {
            end_date: {
              lt: now,
            },
          },
        }),
        prisma.eventAttendee.count(),
      ]);

    // Get blog statistics
    const [totalPosts, totalAuthors, postsThisMonth] = await Promise.all([
      prisma.blogPost.count(),
      prisma.blogAuthor.count(),
      prisma.blogPost.count({
        where: {
          created_at: {
            gte: startOfMonth,
          },
        },
      }),
    ]);

    // System information
    const uptime = process.uptime();
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);

    const analytics = {
      users: {
        total: totalUsers,
        byRole: {
          user: userRoleStats.user || 0,
          writer: userRoleStats.writer || 0,
          event_admin: userRoleStats.event_admin || 0,
          admin: userRoleStats.admin || 0,
          superadmin: userRoleStats.superadmin || 0,
        },
        newThisMonth: newUsersThisMonth,
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        past: pastEvents,
        totalAttendees,
      },
      blog: {
        totalPosts,
        totalAuthors,
        postsThisMonth,
      },
      system: {
        version: process.env.npm_package_version || "1.0.0",
        uptime: `${uptimeHours}h ${uptimeMinutes}m`,
        environment: process.env.NODE_ENV || "development",
        timestamp: now.toISOString(),
      },
    };

    return successResponse(res, analytics);
  })
);

/**
 * @swagger
 * /api/v3/admin/users/{id}/permissions:
 *   get:
 *     tags: [Admin Management]
 *     summary: Get user permissions
 *     description: Retrieve detailed permission information for a specific user. Admin or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User permissions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                       example: 123
 *                     role:
 *                       type: string
 *                       example: "writer"
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["READ_BLOG_POST", "CREATE_BLOG_POST", "UPDATE_BLOG_POST"]
 *                     permissionContext:
 *                       type: object
 *                       properties:
 *                         canManageUsers:
 *                           type: boolean
 *                           example: false
 *                         canCreateContent:
 *                           type: boolean
 *                           example: true
 *                         canManageEvents:
 *                           type: boolean
 *                           example: false
 *                         isAdmin:
 *                           type: boolean
 *                           example: false
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
adminRoutes.get(
  "/admin/users/:id/permissions",
  authenticate,
  requirePermission(Permission.MANAGE_ROLES),
  validate(ParamIdSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      throw new Error("Invalid user ID");
    }

    // Get user with role information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Get permission context
    const userRole = (user.roles?.role as any) || "user";
    const permissionContext = getUserPermissionContext({
      id: user.id,
      uid: user.uid,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: userRole,
      permissions: [],
    });

    const responseData = {
      userId: user.id,
      role: userRole,
      permissions: permissionContext.permissions,
      permissionContext: {
        canManageUsers: permissionContext.canManageUsers,
        canCreateContent: permissionContext.canCreateContent,
        canManageEvents: permissionContext.canManageEvents,
        isAdmin: permissionContext.isAdmin,
      },
    };

    return successResponse(res, responseData);
  })
);

/**
 * @swagger
 * /api/v3/admin/system/health:
 *   get:
 *     tags: [Admin Management]
 *     summary: Get detailed system health
 *     description: Retrieve detailed system health information. Admin or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "connected"
 *                         responseTime:
 *                           type: number
 *                           example: 12.5
 *                     memory:
 *                       type: object
 *                       properties:
 *                         used:
 *                           type: string
 *                           example: "145.6 MB"
 *                         total:
 *                           type: string
 *                           example: "512 MB"
 *                         percentage:
 *                           type: number
 *                           example: 28.5
 *                     uptime:
 *                       type: string
 *                       example: "3d 14h 25m"
 *                     version:
 *                       type: string
 *                       example: "1.0.0"
 *                     environment:
 *                       type: string
 *                       example: "production"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
adminRoutes.get(
  "/admin/system/health",
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  asyncHandler(async (req, res) => {
    const startTime = Date.now();

    // Test database connection
    let dbStatus = "connected";
    let dbResponseTime = 0;

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - startTime;
    } catch (error) {
      dbStatus = "disconnected";
      console.error("Database health check failed:", error);
    }

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB =
      Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
    const memoryTotalMB =
      Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;
    const memoryPercentage =
      Math.round((memoryUsedMB / memoryTotalMB) * 100 * 100) / 100;

    // Calculate uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const uptimeString = `${days}d ${hours}h ${minutes}m`;

    const healthData = {
      status: dbStatus === "connected" ? "healthy" : "degraded",
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
      },
      memory: {
        used: `${memoryUsedMB} MB`,
        total: `${memoryTotalMB} MB`,
        percentage: memoryPercentage,
      },
      uptime: uptimeString,
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
    };

    return successResponse(res, healthData);
  })
);

export default adminRoutes;

// Export for backward compatibility
export { adminRoutes };
