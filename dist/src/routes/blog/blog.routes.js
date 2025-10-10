"use strict";
// src/routes/blog/blog.routes.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.blogRoutes = void 0;
const express_1 = require("express");
const upload_1 = require("../../config/upload");
const api_types_1 = require("../../types/api.types");
const permissions_1 = require("../../lib/permissions");
const auth_1 = require("../../middlewares/auth");
const validation_1 = require("../../middlewares/validation");
const blog_schemas_1 = require("../../schema/blog.schemas");
const common_schema_1 = require("../../schema/common.schema");
const blog_contoller_1 = __importDefault(require("../../controllers/blog/blog.contoller"));
const blogRoutes = (0, express_1.Router)();
exports.blogRoutes = blogRoutes;
// ============================================================================
// BLOG POSTS ROUTES
// ============================================================================
/**
 * @swagger
 * /api/v3/blog/posts:
 *   get:
 *     tags: [Blog Posts]
 *     summary: Get all blog posts with pagination and filtering
 *     description: Retrieve a paginated list of blog posts. Public access.
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
 *         description: Search term for post title or content
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: integer
 *         description: Filter by author ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [title, created_at, updated_at]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Blog posts retrieved successfully
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/BlogPost'
 *                           - type: object
 *                             properties:
 *                               content:
 *                                 type: string
 *                                 description: Truncated content for list view
 *                                 example: "This is the beginning of the blog post..."
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
blogRoutes.get("/blog/posts", (0, validation_1.validate)(blog_schemas_1.GetBlogPostsQuerySchema), blog_contoller_1.default.getBlogPosts);
/**
 * @swagger
 * /api/v3/blog/posts/{id}:
 *   get:
 *     tags: [Blog Posts]
 *     summary: Get blog post by ID
 *     description: Retrieve detailed information about a specific blog post. Public access.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/BlogPost'
 *                     - type: object
 *                       properties:
 *                         content:
 *                           type: string
 *                           description: Full blog post content
 *                         authors:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/BlogAuthor'
 *                               - type: object
 *                                 properties:
 *                                   createdAt:
 *                                     type: string
 *                                     format: date-time
 *                                     description: Author creation date
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRoutes.get("/blog/posts/:id", (0, validation_1.validate)(common_schema_1.ParamIdSchema), blog_contoller_1.default.getBlogPostById);
/**
 * @swagger
 * /api/v3/blog/posts:
 *   post:
 *     tags: [Blog Posts]
 *     summary: Create new blog post
 *     description: Create a new blog post. Writer, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - authorIds
 *               - previewImage
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Blockchain Technology"
 *               content:
 *                 type: string
 *                 example: "# Introduction\n\nBlockchain technology is revolutionizing..."
 *               authorIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2]
 *                 description: Array of author IDs
 *               previewImage:
 *                 type: string
 *                 format: binary
 *                 description: Blog post preview image file
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
blogRoutes.post("/blog/posts", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.CREATE_BLOG_POST), upload_1.upload.single("previewImage"), (0, validation_1.validateFileUpload)({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: true,
    fieldName: "previewImage",
}), (0, validation_1.validateMultipart)(blog_schemas_1.CreateBlogPostSchema), blog_contoller_1.default.createBlogPost);
/**
 * @swagger
 * /api/v3/blog/posts/{id}:
 *   put:
 *     tags: [Blog Posts]
 *     summary: Update blog post
 *     description: Update blog post details. Writer, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated: Introduction to Blockchain Technology"
 *               content:
 *                 type: string
 *                 example: "# Updated Introduction\n\nBlockchain technology continues to evolve..."
 *               authorIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 3]
 *                 description: Updated array of author IDs
 *               previewImage:
 *                 type: string
 *                 format: binary
 *                 description: Updated blog post preview image file
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogPost'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRoutes.put("/blog/posts/:id", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.UPDATE_BLOG_POST), upload_1.upload.single("previewImage"), (0, validation_1.validateFileUpload)({
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    required: false,
    fieldName: "previewImage",
}), (0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, validation_1.validateMultipart)(blog_schemas_1.UpdateBlogPostSchema), blog_contoller_1.default.updateBlogPost);
/**
 * @swagger
 * /api/v3/blog/posts/{id}:
 *   delete:
 *     tags: [Blog Posts]
 *     summary: Delete blog post
 *     description: Delete a blog post. Writer, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog post ID
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
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
blogRoutes.delete("/blog/posts/:id", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.DELETE_BLOG_POST), (0, validation_1.validate)(common_schema_1.ParamIdSchema), blog_contoller_1.default.deleteBlogPost);
// ============================================================================
// BLOG AUTHORS ROUTES
// ============================================================================
/**
 * @swagger
 * /api/v3/blog/authors:
 *   get:
 *     tags: [Blog Authors]
 *     summary: Get all blog authors with pagination
 *     description: Retrieve a paginated list of blog authors. Public access.
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
 *     responses:
 *       200:
 *         description: Blog authors retrieved successfully
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
 *                         allOf:
 *                           - $ref: '#/components/schemas/BlogAuthor'
 *                           - type: object
 *                             properties:
 *                               postsCount:
 *                                 type: integer
 *                                 description: Number of posts by this author
 *                                 example: 5
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
blogRoutes.get("/blog/authors", (0, validation_1.validate)(common_schema_1.PaginationQuerySchema), blog_contoller_1.default.getBlogAuthors);
/**
 * @swagger
 * /api/v3/blog/authors/{id}:
 *   get:
 *     tags: [Blog Authors]
 *     summary: Get blog author by ID
 *     description: Retrieve detailed information about a specific blog author including their posts. Public access.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog author ID
 *     responses:
 *       200:
 *         description: Blog author retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/BlogAuthor'
 *                     - type: object
 *                       properties:
 *                         posts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               uid:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               previewImage:
 *                                 type: string
 *                                 format: uri
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                         postsCount:
 *                           type: integer
 *                           description: Total number of posts by this author
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRoutes.get("/blog/authors/:id", (0, validation_1.validate)(common_schema_1.ParamIdSchema), blog_contoller_1.default.getBlogAuthorById);
/**
 * @swagger
 * /api/v3/blog/authors:
 *   post:
 *     tags: [Blog Authors]
 *     summary: Create new blog author
 *     description: Create a new blog author. Writer, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - roleSkill
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith"
 *               roleSkill:
 *                 type: string
 *                 example: "Blockchain Developer"
 *               xUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/janesmith"
 *               linkedinUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://linkedin.com/in/janesmith"
 *               instagramUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://instagram.com/janesmith"
 *               facebookUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://facebook.com/janesmith"
 *               discordUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://discord.gg/janesmith"
 *     responses:
 *       201:
 *         description: Blog author created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogAuthor'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       409:
 *         description: Author with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Conflict'
 */
blogRoutes.post("/blog/authors", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.CREATE_BLOG_POST), // Using same permission as blog posts
(0, validation_1.validate)(blog_schemas_1.CreateBlogAuthorSchema), blog_contoller_1.default.createBlogAuthor);
/**
 * @swagger
 * /api/v3/blog/authors/{id}:
 *   put:
 *     tags: [Blog Authors]
 *     summary: Update blog author
 *     description: Update blog author details. Writer, Admin, or Superadmin access required.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog author ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Smith Updated"
 *               roleSkill:
 *                 type: string
 *                 example: "Senior Blockchain Developer"
 *               xUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://x.com/janesmithdev"
 *               linkedinUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://linkedin.com/in/janesmithdev"
 *               instagramUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://instagram.com/janesmithdev"
 *               facebookUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://facebook.com/janesmithdev"
 *               discordUrl:
 *                 type: string
 *                 format: uri
 *                 example: "https://discord.gg/janesmithdev"
 *     responses:
 *       200:
 *         description: Blog author updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/BlogAuthor'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Author with this name already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Conflict'
 */
blogRoutes.put("/blog/authors/:id", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.UPDATE_BLOG_POST), // Using same permission as blog posts
(0, validation_1.validate)(common_schema_1.ParamIdSchema), (0, validation_1.validate)(blog_schemas_1.UpdateBlogAuthorSchema), blog_contoller_1.default.updateBlogAuthor);
/**
 * @swagger
 * /api/v3/blog/authors/{id}:
 *   delete:
 *     tags: [Blog Authors]
 *     summary: Delete blog author
 *     description: Delete a blog author. Writer, Admin, or Superadmin access required. Cannot delete author with existing posts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Blog author ID
 *     responses:
 *       200:
 *         description: Blog author deleted successfully
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
 *       400:
 *         description: Cannot delete author with existing posts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
blogRoutes.delete("/blog/authors/:id", auth_1.authenticate, (0, permissions_1.requirePermission)(api_types_1.Permission.DELETE_BLOG_POST), // Using same permission as blog posts
(0, validation_1.validate)(common_schema_1.ParamIdSchema), blog_contoller_1.default.deleteBlogAuthor);
exports.default = blogRoutes;
