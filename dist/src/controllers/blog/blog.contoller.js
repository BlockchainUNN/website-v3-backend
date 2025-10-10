"use strict";
// src/controllers/blog/blog.controllers.ts
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
exports.deleteBlogAuthor = exports.updateBlogAuthor = exports.createBlogAuthor = exports.getBlogAuthorById = exports.getBlogAuthors = exports.deleteBlogPost = exports.updateBlogPost = exports.createBlogPost = exports.getBlogPostById = exports.getBlogPosts = void 0;
const response_1 = require("../../lib/response");
const response_2 = require("../../lib/response");
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const api_types_1 = require("../../types/api.types");
const permissions_1 = require("../../lib/permissions");
const client_1 = __importDefault(require("../../../prisma/client"));
const error_1 = require("../../lib/error");
const errorHandler_1 = require("../../middlewares/errorHandler");
// ============================================================================
// BLOG POSTS CONTROLLERS
// ============================================================================
/**
 * Get all blog posts with pagination and filtering
 * @route GET /api/v3/blog/posts
 * @access Public
 */
exports.getBlogPosts = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const { page = 1, limit = 10, search, authorId, sortBy = "created_at", sortOrder = "desc", } = query;
    // Build where clause for filtering
    const where = {};
    if (search) {
        where.OR = [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
        ];
    }
    if (authorId) {
        where.authors = {
            some: {
                author_id: authorId,
            },
        };
    }
    // Get total count for pagination
    const total = yield client_1.default.blogPost.count({ where });
    // Get blog posts with pagination
    const blogPosts = yield client_1.default.blogPost.findMany({
        where,
        include: {
            authors: {
                include: {
                    author: true,
                },
            },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
    });
    // Transform blog posts for response
    const transformedPosts = blogPosts.map((post) => ({
        id: post.id,
        uid: post.uid,
        title: post.title,
        content: post.content.substring(0, 300) +
            (post.content.length > 300 ? "..." : ""), // Truncate for list view
        previewImage: post.preview_image,
        authors: post.authors.map((authorRel) => ({
            id: authorRel.author.id,
            name: authorRel.author.name,
            roleSkill: authorRel.author.role_skill,
            xUrl: authorRel.author.x_url,
            linkedinUrl: authorRel.author.linkedin_url,
            instagramUrl: authorRel.author.instagram_url,
            facebookUrl: authorRel.author.facebook_url,
            discordUrl: authorRel.author.discord_url,
        })),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
    }));
    const pagination = (0, response_2.calculatePagination)({ total, page, limit });
    return (0, response_1.paginatedResponse)(res, transformedPosts, pagination);
}));
/**
 * Get blog post by ID
 * @route GET /api/v3/blog/posts/:id
 * @access Public
 */
exports.getBlogPostById = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
        throw error_1.AppError.badRequest("Invalid blog post ID");
    }
    const blogPost = yield client_1.default.blogPost.findUnique({
        where: { id: postId },
        include: {
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    if (!blogPost) {
        throw error_1.AppError.blogPostNotFound(postId);
    }
    const transformedPost = {
        id: blogPost.id,
        uid: blogPost.uid,
        title: blogPost.title,
        content: blogPost.content, // Full content for detailed view
        previewImage: blogPost.preview_image,
        authors: blogPost.authors.map((authorRel) => ({
            id: authorRel.author.id,
            name: authorRel.author.name,
            roleSkill: authorRel.author.role_skill,
            xUrl: authorRel.author.x_url,
            linkedinUrl: authorRel.author.linkedin_url,
            instagramUrl: authorRel.author.instagram_url,
            facebookUrl: authorRel.author.facebook_url,
            discordUrl: authorRel.author.discord_url,
            createdAt: authorRel.author.created_at,
        })),
        createdAt: blogPost.created_at,
        updatedAt: blogPost.updated_at,
    };
    return (0, response_1.successResponse)(res, transformedPost);
}));
/**
 * Create new blog post
 * @route POST /api/v3/blog/posts
 * @access Writer, Admin, Superadmin
 */
exports.createBlogPost = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const postData = req.body;
    const previewImage = req.file;
    if (!previewImage) {
        throw error_1.AppError.badRequest("Preview image is required");
    }
    // Validate that all provided author IDs exist
    if (postData.authorIds && postData.authorIds.length > 0) {
        const existingAuthors = yield client_1.default.blogAuthor.findMany({
            where: {
                id: { in: postData.authorIds },
            },
        });
        if (existingAuthors.length !== postData.authorIds.length) {
            const missingIds = postData.authorIds.filter((id) => !existingAuthors.some((author) => author.id === id));
            throw error_1.AppError.badRequest(`Authors with IDs ${missingIds.join(", ")} not found`);
        }
    }
    // Handle preview image upload
    let uploadedImage;
    try {
        uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(previewImage);
    }
    catch (error) {
        throw error_1.AppError.fileUploadError("Failed to upload preview image", error);
    }
    // Create blog post in a transaction
    const newBlogPost = yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Create the blog post
        const post = yield tx.blogPost.create({
            data: {
                uid: `post_${Date.now()}`, // Simple UID generation
                title: postData.title,
                content: postData.content,
                preview_image: uploadedImage.url,
            },
        });
        // Create author relationships
        if (postData.authorIds && postData.authorIds.length > 0) {
            yield tx.blogPostAuthor.createMany({
                data: postData.authorIds.map((authorId) => ({
                    post_id: post.id,
                    author_id: authorId,
                })),
            });
        }
        return post;
    }));
    // Fetch the complete blog post data
    const postWithAuthors = yield client_1.default.blogPost.findUnique({
        where: { id: newBlogPost.id },
        include: {
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    const responseData = {
        id: postWithAuthors.id,
        uid: postWithAuthors.uid,
        title: postWithAuthors.title,
        content: postWithAuthors.content,
        previewImage: postWithAuthors.preview_image,
        authors: postWithAuthors.authors.map((authorRel) => ({
            id: authorRel.author.id,
            name: authorRel.author.name,
            roleSkill: authorRel.author.role_skill,
            xUrl: authorRel.author.x_url,
            linkedinUrl: authorRel.author.linkedin_url,
            instagramUrl: authorRel.author.instagram_url,
            facebookUrl: authorRel.author.facebook_url,
            discordUrl: authorRel.author.discord_url,
        })),
        createdAt: postWithAuthors.created_at,
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/blog/posts/${newBlogPost.id}`, "Blog post created successfully");
}));
/**
 * Update blog post
 * @route PUT /api/v3/blog/posts/:id
 * @access Writer, Admin, Superadmin
 */
exports.updateBlogPost = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const postId = parseInt(id);
    const updateData = req.body;
    const previewImage = req.file;
    if (isNaN(postId)) {
        throw error_1.AppError.badRequest("Invalid blog post ID");
    }
    // Check if blog post exists
    const existingPost = yield client_1.default.blogPost.findUnique({
        where: { id: postId },
        include: {
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    if (!existingPost) {
        throw error_1.AppError.blogPostNotFound(postId);
    }
    // Check permissions (for now, any writer/admin can edit any post)
    // TODO: Add author-specific ownership check if needed
    if (!(0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.UPDATE_BLOG_POST)) {
        throw error_1.AppError.forbidden("Cannot update blog posts");
    }
    // Validate author IDs if provided
    if (updateData.authorIds && updateData.authorIds.length > 0) {
        const existingAuthors = yield client_1.default.blogAuthor.findMany({
            where: {
                id: { in: updateData.authorIds },
            },
        });
        if (existingAuthors.length !== updateData.authorIds.length) {
            const missingIds = updateData.authorIds.filter((id) => !existingAuthors.some((author) => author.id === id));
            throw error_1.AppError.badRequest(`Authors with IDs ${missingIds.join(", ")} not found`);
        }
    }
    // Handle preview image upload
    let uploadedImageUrl = existingPost.preview_image;
    if (previewImage) {
        try {
            const uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(previewImage);
            uploadedImageUrl = uploadedImage.url;
        }
        catch (error) {
            throw error_1.AppError.fileUploadError("Failed to upload preview image", error);
        }
    }
    // Update blog post in a transaction
    const updatedPost = yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update the blog post
        const post = yield tx.blogPost.update({
            where: { id: postId },
            data: Object.assign(Object.assign(Object.assign({}, (updateData.title && { title: updateData.title })), (updateData.content && { content: updateData.content })), (uploadedImageUrl !== existingPost.preview_image && {
                preview_image: uploadedImageUrl,
            })),
        });
        // Update author relationships if provided
        if (updateData.authorIds) {
            // Delete existing author relationships
            yield tx.blogPostAuthor.deleteMany({
                where: { post_id: postId },
            });
            // Create new author relationships
            if (updateData.authorIds.length > 0) {
                yield tx.blogPostAuthor.createMany({
                    data: updateData.authorIds.map((authorId) => ({
                        post_id: postId,
                        author_id: authorId,
                    })),
                });
            }
        }
        return post;
    }));
    // Fetch the complete updated blog post data
    const postWithAuthors = yield client_1.default.blogPost.findUnique({
        where: { id: postId },
        include: {
            authors: {
                include: {
                    author: true,
                },
            },
        },
    });
    const responseData = {
        id: postWithAuthors.id,
        uid: postWithAuthors.uid,
        title: postWithAuthors.title,
        content: postWithAuthors.content,
        previewImage: postWithAuthors.preview_image,
        authors: postWithAuthors.authors.map((authorRel) => ({
            id: authorRel.author.id,
            name: authorRel.author.name,
            roleSkill: authorRel.author.role_skill,
            xUrl: authorRel.author.x_url,
            linkedinUrl: authorRel.author.linkedin_url,
            instagramUrl: authorRel.author.instagram_url,
            facebookUrl: authorRel.author.facebook_url,
            discordUrl: authorRel.author.discord_url,
        })),
        updatedAt: postWithAuthors.updated_at,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Blog post updated successfully");
}));
/**
 * Delete blog post
 * @route DELETE /api/v3/blog/posts/:id
 * @access Writer, Admin, Superadmin
 */
exports.deleteBlogPost = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const postId = parseInt(id);
    if (isNaN(postId)) {
        throw error_1.AppError.badRequest("Invalid blog post ID");
    }
    const blogPost = yield client_1.default.blogPost.findUnique({
        where: { id: postId },
    });
    if (!blogPost) {
        throw error_1.AppError.blogPostNotFound(postId);
    }
    // Check permissions
    if (!(0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.DELETE_BLOG_POST)) {
        throw error_1.AppError.forbidden("Cannot delete blog posts");
    }
    // Delete blog post (cascade will handle related records)
    yield client_1.default.blogPost.delete({
        where: { id: postId },
    });
    return (0, response_1.successResponse)(res, { id: postId }, 200, "Blog post deleted successfully");
}));
// ============================================================================
// BLOG AUTHORS CONTROLLERS
// ============================================================================
/**
 * Get all blog authors
 * @route GET /api/v3/blog/authors
 * @access Public
 */
exports.getBlogAuthors = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = (0, response_2.parsePaginationQuery)(req.query);
    // Get total count for pagination
    const total = yield client_1.default.blogAuthor.count();
    // Get authors with pagination
    const authors = yield client_1.default.blogAuthor.findMany({
        include: {
            _count: {
                select: {
                    posts: true,
                },
            },
        },
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
    });
    // Transform authors for response
    const transformedAuthors = authors.map((author) => ({
        id: author.id,
        name: author.name,
        roleSkill: author.role_skill,
        xUrl: author.x_url,
        linkedinUrl: author.linkedin_url,
        instagramUrl: author.instagram_url,
        facebookUrl: author.facebook_url,
        discordUrl: author.discord_url,
        createdAt: author.created_at,
        postsCount: author._count.posts,
    }));
    const pagination = (0, response_2.calculatePagination)({ total, page, limit });
    return (0, response_1.paginatedResponse)(res, transformedAuthors, pagination);
}));
/**
 * Get blog author by ID
 * @route GET /api/v3/blog/authors/:id
 * @access Public
 */
exports.getBlogAuthorById = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const authorId = parseInt(id);
    if (isNaN(authorId)) {
        throw error_1.AppError.badRequest("Invalid author ID");
    }
    const author = yield client_1.default.blogAuthor.findUnique({
        where: { id: authorId },
        include: {
            posts: {
                include: {
                    post: {
                        select: {
                            id: true,
                            uid: true,
                            title: true,
                            preview_image: true,
                            created_at: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    posts: true,
                },
            },
        },
    });
    if (!author) {
        throw error_1.AppError.notFound("Blog author not found");
    }
    const transformedAuthor = {
        id: author.id,
        name: author.name,
        roleSkill: author.role_skill,
        xUrl: author.x_url,
        linkedinUrl: author.linkedin_url,
        instagramUrl: author.instagram_url,
        facebookUrl: author.facebook_url,
        discordUrl: author.discord_url,
        createdAt: author.created_at,
        posts: author.posts.map((postRel) => ({
            id: postRel.post.id,
            uid: postRel.post.uid,
            title: postRel.post.title,
            previewImage: postRel.post.preview_image,
            createdAt: postRel.post.created_at,
        })),
        postsCount: author._count.posts,
    };
    return (0, response_1.successResponse)(res, transformedAuthor);
}));
/**
 * Create new blog author
 * @route POST /api/v3/blog/authors
 * @access Writer, Admin, Superadmin
 */
exports.createBlogAuthor = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const authorData = req.body;
    // Check if author with the same name already exists
    const existingAuthor = yield client_1.default.blogAuthor.findFirst({
        where: { name: authorData.name },
    });
    if (existingAuthor) {
        throw error_1.AppError.conflict(`Author with name "${authorData.name}" already exists`);
    }
    // Create blog author
    const newAuthor = yield client_1.default.blogAuthor.create({
        data: {
            name: authorData.name,
            role_skill: authorData.roleSkill,
            x_url: authorData.xUrl || null,
            linkedin_url: authorData.linkedinUrl || null,
            instagram_url: authorData.instagramUrl || null,
            facebook_url: authorData.facebookUrl || null,
            discord_url: authorData.discordUrl || null,
        },
    });
    const responseData = {
        id: newAuthor.id,
        name: newAuthor.name,
        roleSkill: newAuthor.role_skill,
        xUrl: newAuthor.x_url,
        linkedinUrl: newAuthor.linkedin_url,
        instagramUrl: newAuthor.instagram_url,
        facebookUrl: newAuthor.facebook_url,
        discordUrl: newAuthor.discord_url,
        createdAt: newAuthor.created_at,
        postsCount: 0,
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/blog/authors/${newAuthor.id}`, "Blog author created successfully");
}));
/**
 * Update blog author
 * @route PUT /api/v3/blog/authors/:id
 * @access Writer, Admin, Superadmin
 */
exports.updateBlogAuthor = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const authorId = parseInt(id);
    const updateData = req.body;
    if (isNaN(authorId)) {
        throw error_1.AppError.badRequest("Invalid author ID");
    }
    // Check if author exists
    const existingAuthor = yield client_1.default.blogAuthor.findUnique({
        where: { id: authorId },
    });
    if (!existingAuthor) {
        throw error_1.AppError.notFound("Blog author not found");
    }
    // Check permissions
    if (!(0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.UPDATE_BLOG_POST)) {
        throw error_1.AppError.forbidden("Cannot update blog authors");
    }
    // If name is being updated, check for conflicts
    if (updateData.name && updateData.name !== existingAuthor.name) {
        const nameExists = yield client_1.default.blogAuthor.findFirst({
            where: { name: updateData.name },
        });
        if (nameExists) {
            throw error_1.AppError.conflict(`Author with name "${updateData.name}" already exists`);
        }
    }
    // Update author
    const updatedAuthor = yield client_1.default.blogAuthor.update({
        where: { id: authorId },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (updateData.name && { name: updateData.name })), (updateData.roleSkill && { role_skill: updateData.roleSkill })), (updateData.xUrl !== undefined && { x_url: updateData.xUrl })), (updateData.linkedinUrl !== undefined && {
            linkedin_url: updateData.linkedinUrl,
        })), (updateData.instagramUrl !== undefined && {
            instagram_url: updateData.instagramUrl,
        })), (updateData.facebookUrl !== undefined && {
            facebook_url: updateData.facebookUrl,
        })), (updateData.discordUrl !== undefined && {
            discord_url: updateData.discordUrl,
        })),
        include: {
            _count: {
                select: {
                    posts: true,
                },
            },
        },
    });
    const responseData = {
        id: updatedAuthor.id,
        name: updatedAuthor.name,
        roleSkill: updatedAuthor.role_skill,
        xUrl: updatedAuthor.x_url,
        linkedinUrl: updatedAuthor.linkedin_url,
        instagramUrl: updatedAuthor.instagram_url,
        facebookUrl: updatedAuthor.facebook_url,
        discordUrl: updatedAuthor.discord_url,
        createdAt: updatedAuthor.created_at,
        postsCount: updatedAuthor._count.posts,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Blog author updated successfully");
}));
/**
 * Delete blog author
 * @route DELETE /api/v3/blog/authors/:id
 * @access Writer, Admin, Superadmin
 */
exports.deleteBlogAuthor = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const authorId = parseInt(id);
    if (isNaN(authorId)) {
        throw error_1.AppError.badRequest("Invalid author ID");
    }
    const author = yield client_1.default.blogAuthor.findUnique({
        where: { id: authorId },
        include: {
            _count: {
                select: {
                    posts: true,
                },
            },
        },
    });
    if (!author) {
        throw error_1.AppError.notFound("Blog author not found");
    }
    // Check permissions
    if (!(0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.DELETE_BLOG_POST)) {
        throw error_1.AppError.forbidden("Cannot delete blog authors");
    }
    // Check if author has posts
    if (author._count.posts > 0) {
        throw error_1.AppError.badRequest("Cannot delete author with existing blog posts. Please reassign or delete the posts first.");
    }
    // Delete author
    yield client_1.default.blogAuthor.delete({
        where: { id: authorId },
    });
    return (0, response_1.successResponse)(res, { id: authorId }, 200, "Blog author deleted successfully");
}));
exports.default = {
    // Blog Posts
    getBlogPosts: exports.getBlogPosts,
    getBlogPostById: exports.getBlogPostById,
    createBlogPost: exports.createBlogPost,
    updateBlogPost: exports.updateBlogPost,
    deleteBlogPost: exports.deleteBlogPost,
    // Blog Authors
    getBlogAuthors: exports.getBlogAuthors,
    getBlogAuthorById: exports.getBlogAuthorById,
    createBlogAuthor: exports.createBlogAuthor,
    updateBlogAuthor: exports.updateBlogAuthor,
    deleteBlogAuthor: exports.deleteBlogAuthor,
};
