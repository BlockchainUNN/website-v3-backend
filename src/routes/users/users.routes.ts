import { Router } from "express";
import { upload } from "../../config/upload";
import { Permission } from "../../types/api.types";
import userController from "../../controllers/users/users.controllers";
import {
  requirePermission,
  requireOwnershipOrPermission,
} from "../../lib/permissions";
import { authenticate } from "../../middlewares/auth";
import {
  validate,
  validateFileUpload,
  validateMultipart,
} from "../../middlewares/validation";
import { ParamIdSchema } from "../../schema/common.schema";
import {
  GetUsersQuerySchema,
  CreateUserSchema,
  UpdateUserSchema,
  AdminRegistrationSchema,
  LoginUserSchema,
} from "../../schema/user.schema";

const userRoutes = Router();

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
userRoutes.get(
  "/users",
  authenticate,
  requirePermission(Permission.READ_USER),
  validate(GetUsersQuerySchema),
  userController.getUsers
);

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
userRoutes.get(
  "/users/:id",
  authenticate,
  validate(ParamIdSchema),
  requireOwnershipOrPermission(Permission.READ_USER),
  userController.getUserById
);

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
userRoutes.post(
  "/users",
  upload.single("profilePic"),
  validateFileUpload({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false,
    fieldName: "profilePic",
  }),
  validateMultipart(CreateUserSchema),
  userController.createUser
);

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
userRoutes.put(
  "/users/:id",
  authenticate,
  upload.single("profilePic"),
  validateFileUpload({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false,
    fieldName: "profilePic",
  }),
  validate(ParamIdSchema),
  validateMultipart(UpdateUserSchema),
  requireOwnershipOrPermission(Permission.UPDATE_USER),
  userController.updateUser
);

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
userRoutes.delete(
  "/users/:id",
  authenticate,
  validate(ParamIdSchema),
  requirePermission(Permission.DELETE_USER),
  userController.deleteUser
);

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
userRoutes.post(
  "/admin/register",
  authenticate,
  requirePermission(Permission.MANAGE_ROLES),
  validate(AdminRegistrationSchema),
  userController.registerAdmin
);

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
userRoutes.post(
  "/auth/login",
  validate(LoginUserSchema),
  userController.loginUser
);

export default userRoutes;

// Export for backward compatibility
export { userRoutes };
