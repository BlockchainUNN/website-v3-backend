"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoutes = void 0;
const express_1 = require("express");
const upload_1 = require("../../config/upload");
const api_types_1 = require("../../types/api.types");
const users_controllers_1 = __importDefault(require("../../controllers/users/users.controllers"));
const permissions_1 = require("../../lib/permissions");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const common_schema_1 = require("../../schema/common.schema");
const user_schema_1 = require("../../schema/user.schema");
const userRoutes = (0, express_1.Router)();
exports.userRoutes = userRoutes;
/**
 * @swagger
 * /api/v3/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users with pagination and filtering
 *     description: Retrieve a paginated list of users. Admin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [firstName, lastName, email, created_at]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
userRoutes.get("/users", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.READ_USER), (0, validation_1.validate)(user_schema_1.GetUsersQuerySchema), users_controllers_1.default.getUsers);
/**
 * @swagger
 * /api/v3/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve a specific user's details. Admin access or user themselves required.
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserDetails'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.get("/users/:id", auth_1.authenticate, (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, permissions_1.requireOwnershipOrPermission)(api_types_1.Permission.READ_USER), users_controllers_1.default.getUserById);
/**
 * @swagger
 * /api/v3/users:
 *   post:
 *     tags: [Users]
 *     summary: Create new user (public registration)
 *     description: Register a new user account. Public access.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               subCommunities:
 *                 type: array
 *                 items:
 *                   type: string
 *               techSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               profilePic:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
userRoutes.post("/users", upload_1.upload.single("profilePic"), (0, validation_1.validateFileUpload)({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false,
    fieldName: "profilePic",
}), (0, validation_1.validateMultipart)(user_schema_1.CreateUserSchema), users_controllers_1.default.createUser);
/**
 * @swagger
 * /api/v3/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user
 *     description: Update user details. Admin access or user themselves required.
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               subCommunities:
 *                 type: array
 *                 items:
 *                   type: string
 *               techSkills:
 *                 type: array
 *                 items:
 *                   type: string
 *               profilePic:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture file
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
userRoutes.put("/users/:id", auth_1.authenticate, upload_1.upload.single("profilePic"), (0, validation_1.validateFileUpload)({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false,
    fieldName: "profilePic",
}), (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, validation_1.validateMultipart)(user_schema_1.UpdateUserSchema), (0, permissions_1.requireOwnershipOrPermission)(api_types_1.Permission.UPDATE_USER), users_controllers_1.default.updateUser);
/**
 * @swagger
 * /api/v3/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user
 *     description: Delete a user account. Admin access required.
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
 *         description: User deleted successfully
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
 *                     id:
 *                       type: integer
 *                       example: 123
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
userRoutes.delete("/users/:id", auth_1.authenticate, (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, permissions_1.requirePermission)(api_types_1.Permission.DELETE_USER), users_controllers_1.default.deleteUser);
/**
 * @swagger
 * /api/v3/admin/register:
 *   post:
 *     tags: [Admin]
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
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
userRoutes.post("/admin/register", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.MANAGE_ROLES), (0, validation_1.validate)(user_schema_1.AdminRegistrationSchema), users_controllers_1.default.registerAdmin);
/**
 * @swagger
 * /api/v3/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return access tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful
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
 */
userRoutes.post("/auth/login", (0, validation_1.validate)(user_schema_1.LoginUserSchema), users_controllers_1.default.loginUser);
exports.default = userRoutes;
