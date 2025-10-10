"use strict";
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
exports.adminRoutes = void 0;
const express_1 = require("express");
const api_types_1 = require("../../types/api.types");
const users_controllers_1 = __importDefault(require("../../controllers/users/users.controllers"));
const response_1 = require("../../lib/response");
const client_1 = __importDefault(require("../../../prisma/client"));
const permissions_1 = require("../../lib/permissions");
const auth_1 = require("../../middlewares/auth");
const errorHandler_1 = require("../../middlewares/errorHandler");
const validation_1 = require("../../middlewares/validation");
const common_schema_1 = require("../../schema/common.schema");
const user_schema_1 = require("../../schema/user.schema");
const adminRoutes = (0, express_1.Router)();
exports.adminRoutes = adminRoutes;
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
adminRoutes.post("/admin/register", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.MANAGE_ROLES), (0, permissions_1.checkAdminSlots)(3), // Maximum 3 admins
(0, validation_1.validate)(user_schema_1.AdminRegistrationSchema), users_controllers_1.default.registerAdmin);
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
adminRoutes.put("/admin/users/:id/assign-role", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.MANAGE_ROLES), (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
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
    const user = yield client_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Get or create role
    let userRole = yield client_1.default.role.findUnique({
        where: { role },
    });
    if (!userRole) {
        userRole = yield client_1.default.role.create({
            data: { role },
        });
    }
    // Update user role
    const updatedUser = yield client_1.default.user.update({
        where: { id: userId },
        data: { roleId: userRole.id },
        include: { roles: true },
    });
    // Get permissions for the new role
    const permissions = (0, permissions_1.getUserPermissionContext)({
        id: updatedUser.id,
        uid: updatedUser.uid,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        role: role,
        permissions: [],
    });
    const responseData = {
        userId: updatedUser.id,
        role: (_a = updatedUser.roles) === null || _a === void 0 ? void 0 : _a.role,
        permissions: permissions.permissions,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Role assigned successfully");
})));
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
adminRoutes.get("/admin/analytics", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.VIEW_ANALYTICS), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // Get user statistics
    const [totalUsers, usersByRole, newUsersThisMonth] = yield Promise.all([
        client_1.default.user.count(),
        client_1.default.user.groupBy({
            by: ["roleId"],
            _count: { id: true },
        }),
        client_1.default.user.count({
            where: {
                created_at: {
                    gte: startOfMonth,
                },
            },
        }),
    ]);
    // Get role names
    const roles = yield client_1.default.role.findMany();
    const roleMap = roles.reduce((acc, role) => {
        acc[role.id] = role.role;
        return acc;
    }, {});
    const userRoleStats = usersByRole.reduce((acc, stat) => {
        // If roleId is null, treat as "user"
        const roleName = stat.roleId !== null ? roleMap[stat.roleId] : "user";
        acc[roleName] = stat._count.id;
        return acc;
    }, {});
    // Get event statistics
    const [totalEvents, upcomingEvents, pastEvents, totalAttendees] = yield Promise.all([
        client_1.default.event.count(),
        client_1.default.event.count({
            where: {
                start_date: {
                    gte: now,
                },
            },
        }),
        client_1.default.event.count({
            where: {
                end_date: {
                    lt: now,
                },
            },
        }),
        client_1.default.eventAttendee.count(),
    ]);
    // Get blog statistics
    const [totalPosts, totalAuthors, postsThisMonth] = yield Promise.all([
        client_1.default.blogPost.count(),
        client_1.default.blogAuthor.count(),
        client_1.default.blogPost.count({
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
    return (0, response_1.successResponse)(res, analytics);
})));
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
adminRoutes.get("/admin/users/:id/permissions", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.MANAGE_ROLES), (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
        throw new Error("Invalid user ID");
    }
    // Get user with role information
    const user = yield client_1.default.user.findUnique({
        where: { id: userId },
        include: { roles: true },
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Get permission context
    const userRole = ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || "user";
    const permissionContext = (0, permissions_1.getUserPermissionContext)({
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
    return (0, response_1.successResponse)(res, responseData);
})));
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
adminRoutes.get("/admin/system/health", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.VIEW_ANALYTICS), (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startTime = Date.now();
    // Test database connection
    let dbStatus = "connected";
    let dbResponseTime = 0;
    try {
        yield client_1.default.$queryRaw `SELECT 1`;
        dbResponseTime = Date.now() - startTime;
    }
    catch (error) {
        dbStatus = "disconnected";
        console.error("Database health check failed:", error);
    }
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
    const memoryTotalMB = Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;
    const memoryPercentage = Math.round((memoryUsedMB / memoryTotalMB) * 100 * 100) / 100;
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
    return (0, response_1.successResponse)(res, healthData);
})));
exports.default = adminRoutes;
