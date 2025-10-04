// src/controllers/blog/blog.controllers.ts

import { Request, Response } from "express";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from "../../lib/response";
import { calculatePagination, parsePaginationQuery } from "../../lib/response";
import { uploadSingleImage } from "../../utils/imageUploadHandler";
import { Permission } from "../../types/api.types";
import { hasPermission } from "../../lib/permissions";
import prisma from "../../../prisma/client";
import { AppError } from "../../lib/error";
import { asyncHandler } from "../../middlewares/errorHandler";
import {
  GetBlogPostsQuery,
  CreateBlogPostInput,
  UpdateBlogPostInput,
  CreateBlogAuthorInput,
  UpdateBlogAuthorInput,
} from "../../schema/blog.schemas";

// ============================================================================
// BLOG POSTS CONTROLLERS
// ============================================================================

/**
 * Get all blog posts with pagination and filtering
 * @route GET /api/v3/blog/posts
 * @access Public
 */
export const getBlogPosts = asyncHandler(
  async (req: Request, res: Response) => {
    const query = req.query as GetBlogPostsQuery;
    const {
      page = 1,
      limit = 10,
      search,
      authorId,
      sortBy = "created_at",
      sortOrder = "desc",
    } = query;

    // Build where clause for filtering
    const where: any = {};

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
    const total = await prisma.blogPost.count({ where });

    // Get blog posts with pagination
    const blogPosts = await prisma.blogPost.findMany({
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
    const transformedPosts = blogPosts.map(
      (post: {
        id: any;
        uid: any;
        title: any;
        content: string;
        preview_image: any;
        authors: any[];
        created_at: any;
        updated_at: any;
      }) => ({
        id: post.id,
        uid: post.uid,
        title: post.title,
        content:
          post.content.substring(0, 300) +
          (post.content.length > 300 ? "..." : ""), // Truncate for list view
        previewImage: post.preview_image,
        authors: post.authors.map(
          (authorRel: {
            author: {
              id: any;
              name: any;
              role_skill: any;
              x_url: any;
              linkedin_url: any;
              instagram_url: any;
              facebook_url: any;
              discord_url: any;
            };
          }) => ({
            id: authorRel.author.id,
            name: authorRel.author.name,
            roleSkill: authorRel.author.role_skill,
            xUrl: authorRel.author.x_url,
            linkedinUrl: authorRel.author.linkedin_url,
            instagramUrl: authorRel.author.instagram_url,
            facebookUrl: authorRel.author.facebook_url,
            discordUrl: authorRel.author.discord_url,
          })
        ),
        createdAt: post.created_at,
        updatedAt: post.updated_at,
      })
    );

    const pagination = calculatePagination({ total, page, limit });

    return paginatedResponse(res, transformedPosts, pagination);
  }
);

/**
 * Get blog post by ID
 * @route GET /api/v3/blog/posts/:id
 * @access Public
 */
export const getBlogPostById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      throw AppError.badRequest("Invalid blog post ID");
    }

    const blogPost = await prisma.blogPost.findUnique({
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
      throw AppError.blogPostNotFound(postId);
    }

    const transformedPost = {
      id: blogPost.id,
      uid: blogPost.uid,
      title: blogPost.title,
      content: blogPost.content, // Full content for detailed view
      previewImage: blogPost.preview_image,
      authors: blogPost.authors.map(
        (authorRel: {
          author: {
            id: any;
            name: any;
            role_skill: any;
            x_url: any;
            linkedin_url: any;
            instagram_url: any;
            facebook_url: any;
            discord_url: any;
            created_at: any;
          };
        }) => ({
          id: authorRel.author.id,
          name: authorRel.author.name,
          roleSkill: authorRel.author.role_skill,
          xUrl: authorRel.author.x_url,
          linkedinUrl: authorRel.author.linkedin_url,
          instagramUrl: authorRel.author.instagram_url,
          facebookUrl: authorRel.author.facebook_url,
          discordUrl: authorRel.author.discord_url,
          createdAt: authorRel.author.created_at,
        })
      ),
      createdAt: blogPost.created_at,
      updatedAt: blogPost.updated_at,
    };

    return successResponse(res, transformedPost);
  }
);

/**
 * Create new blog post
 * @route POST /api/v3/blog/posts
 * @access Writer, Admin, Superadmin
 */
export const createBlogPost = asyncHandler(
  async (req: Request, res: Response) => {
    const postData = req.body as CreateBlogPostInput;
    const previewImage = req.file;

    if (!previewImage) {
      throw AppError.badRequest("Preview image is required");
    }

    // Validate that all provided author IDs exist
    if (postData.authorIds && postData.authorIds.length > 0) {
      const existingAuthors = await prisma.blogAuthor.findMany({
        where: {
          id: { in: postData.authorIds },
        },
      });

      if (existingAuthors.length !== postData.authorIds.length) {
        const missingIds = postData.authorIds.filter(
          (id: any) =>
            !existingAuthors.some((author: { id: any }) => author.id === id)
        );
        throw AppError.badRequest(
          `Authors with IDs ${missingIds.join(", ")} not found`
        );
      }
    }

    // Handle preview image upload
    let uploadedImage;
    try {
      uploadedImage = await uploadSingleImage(previewImage);
    } catch (error) {
      throw AppError.fileUploadError("Failed to upload preview image", error);
    }

    // Create blog post in a transaction
    const newBlogPost = await prisma.$transaction(
      async (tx: {
        blogPost: {
          create: (arg0: {
            data: {
              uid: string; // Simple UID generation
              title: any;
              content: any;
              preview_image: any;
            };
          }) => any;
        };
        blogPostAuthor: { createMany: (arg0: { data: any }) => any };
      }) => {
        // Create the blog post
        const post = await tx.blogPost.create({
          data: {
            uid: `post_${Date.now()}`, // Simple UID generation
            title: postData.title,
            content: postData.content,
            preview_image: uploadedImage.url,
          },
        });

        // Create author relationships
        if (postData.authorIds && postData.authorIds.length > 0) {
          await tx.blogPostAuthor.createMany({
            data: postData.authorIds.map((authorId: any) => ({
              post_id: post.id,
              author_id: authorId,
            })),
          });
        }

        return post;
      }
    );

    // Fetch the complete blog post data
    const postWithAuthors = await prisma.blogPost.findUnique({
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
      id: postWithAuthors!.id,
      uid: postWithAuthors!.uid,
      title: postWithAuthors!.title,
      content: postWithAuthors!.content,
      previewImage: postWithAuthors!.preview_image,
      authors: postWithAuthors!.authors.map(
        (authorRel: {
          author: {
            id: any;
            name: any;
            role_skill: any;
            x_url: any;
            linkedin_url: any;
            instagram_url: any;
            facebook_url: any;
            discord_url: any;
          };
        }) => ({
          id: authorRel.author.id,
          name: authorRel.author.name,
          roleSkill: authorRel.author.role_skill,
          xUrl: authorRel.author.x_url,
          linkedinUrl: authorRel.author.linkedin_url,
          instagramUrl: authorRel.author.instagram_url,
          facebookUrl: authorRel.author.facebook_url,
          discordUrl: authorRel.author.discord_url,
        })
      ),
      createdAt: postWithAuthors!.created_at,
    };

    return createdResponse(
      res,
      responseData,
      `/api/v3/blog/posts/${newBlogPost.id}`,
      "Blog post created successfully"
    );
  }
);

/**
 * Update blog post
 * @route PUT /api/v3/blog/posts/:id
 * @access Writer, Admin, Superadmin
 */
export const updateBlogPost = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const postId = parseInt(id);
    const updateData = req.body as UpdateBlogPostInput;
    const previewImage = req.file;

    if (isNaN(postId)) {
      throw AppError.badRequest("Invalid blog post ID");
    }

    // Check if blog post exists
    const existingPost = await prisma.blogPost.findUnique({
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
      throw AppError.blogPostNotFound(postId);
    }

    // Check permissions (for now, any writer/admin can edit any post)
    // TODO: Add author-specific ownership check if needed
    if (!hasPermission(req.user!.role, Permission.UPDATE_BLOG_POST)) {
      throw AppError.forbidden("Cannot update blog posts");
    }

    // Validate author IDs if provided
    if (updateData.authorIds && updateData.authorIds.length > 0) {
      const existingAuthors = await prisma.blogAuthor.findMany({
        where: {
          id: { in: updateData.authorIds },
        },
      });

      if (existingAuthors.length !== updateData.authorIds.length) {
        const missingIds = updateData.authorIds.filter(
          (id: any) =>
            !existingAuthors.some((author: { id: any }) => author.id === id)
        );
        throw AppError.badRequest(
          `Authors with IDs ${missingIds.join(", ")} not found`
        );
      }
    }

    // Handle preview image upload
    let uploadedImageUrl = existingPost.preview_image;
    if (previewImage) {
      try {
        const uploadedImage = await uploadSingleImage(previewImage);
        uploadedImageUrl = uploadedImage.url;
      } catch (error) {
        throw AppError.fileUploadError("Failed to upload preview image", error);
      }
    }

    // Update blog post in a transaction
    const updatedPost = await prisma.$transaction(
      async (tx: {
        blogPost: {
          update: (arg0: { where: { id: number }; data: any }) => any;
        };
        blogPostAuthor: {
          deleteMany: (arg0: { where: { post_id: number } }) => any;
          createMany: (arg0: { data: any }) => any;
        };
      }) => {
        // Update the blog post
        const post = await tx.blogPost.update({
          where: { id: postId },
          data: {
            ...(updateData.title && { title: updateData.title }),
            ...(updateData.content && { content: updateData.content }),
            ...(uploadedImageUrl !== existingPost.preview_image && {
              preview_image: uploadedImageUrl,
            }),
          },
        });

        // Update author relationships if provided
        if (updateData.authorIds) {
          // Delete existing author relationships
          await tx.blogPostAuthor.deleteMany({
            where: { post_id: postId },
          });

          // Create new author relationships
          if (updateData.authorIds.length > 0) {
            await tx.blogPostAuthor.createMany({
              data: updateData.authorIds.map((authorId: any) => ({
                post_id: postId,
                author_id: authorId,
              })),
            });
          }
        }

        return post;
      }
    );

    // Fetch the complete updated blog post data
    const postWithAuthors = await prisma.blogPost.findUnique({
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
      id: postWithAuthors!.id,
      uid: postWithAuthors!.uid,
      title: postWithAuthors!.title,
      content: postWithAuthors!.content,
      previewImage: postWithAuthors!.preview_image,
      authors: postWithAuthors!.authors.map(
        (authorRel: {
          author: {
            id: any;
            name: any;
            role_skill: any;
            x_url: any;
            linkedin_url: any;
            instagram_url: any;
            facebook_url: any;
            discord_url: any;
          };
        }) => ({
          id: authorRel.author.id,
          name: authorRel.author.name,
          roleSkill: authorRel.author.role_skill,
          xUrl: authorRel.author.x_url,
          linkedinUrl: authorRel.author.linkedin_url,
          instagramUrl: authorRel.author.instagram_url,
          facebookUrl: authorRel.author.facebook_url,
          discordUrl: authorRel.author.discord_url,
        })
      ),
      updatedAt: postWithAuthors!.updated_at,
    };

    return successResponse(
      res,
      responseData,
      200,
      "Blog post updated successfully"
    );
  }
);

/**
 * Delete blog post
 * @route DELETE /api/v3/blog/posts/:id
 * @access Writer, Admin, Superadmin
 */
export const deleteBlogPost = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const postId = parseInt(id);

    if (isNaN(postId)) {
      throw AppError.badRequest("Invalid blog post ID");
    }

    const blogPost = await prisma.blogPost.findUnique({
      where: { id: postId },
    });

    if (!blogPost) {
      throw AppError.blogPostNotFound(postId);
    }

    // Check permissions
    if (!hasPermission(req.user!.role, Permission.DELETE_BLOG_POST)) {
      throw AppError.forbidden("Cannot delete blog posts");
    }

    // Delete blog post (cascade will handle related records)
    await prisma.blogPost.delete({
      where: { id: postId },
    });

    return successResponse(
      res,
      { id: postId },
      200,
      "Blog post deleted successfully"
    );
  }
);

// ============================================================================
// BLOG AUTHORS CONTROLLERS
// ============================================================================

/**
 * Get all blog authors
 * @route GET /api/v3/blog/authors
 * @access Public
 */
export const getBlogAuthors = asyncHandler(
  async (req: Request, res: Response) => {
    const { page, limit } = parsePaginationQuery(req.query);

    // Get total count for pagination
    const total = await prisma.blogAuthor.count();

    // Get authors with pagination
    const authors = await prisma.blogAuthor.findMany({
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
    const transformedAuthors = authors.map(
      (author: {
        id: any;
        name: any;
        role_skill: any;
        x_url: any;
        linkedin_url: any;
        instagram_url: any;
        facebook_url: any;
        discord_url: any;
        created_at: any;
        _count: { posts: any };
      }) => ({
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
      })
    );

    const pagination = calculatePagination({ total, page, limit });

    return paginatedResponse(res, transformedAuthors, pagination);
  }
);

/**
 * Get blog author by ID
 * @route GET /api/v3/blog/authors/:id
 * @access Public
 */
export const getBlogAuthorById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const authorId = parseInt(id);

    if (isNaN(authorId)) {
      throw AppError.badRequest("Invalid author ID");
    }

    const author = await prisma.blogAuthor.findUnique({
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
      throw AppError.notFound("Blog author not found");
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
      posts: author.posts.map(
        (postRel: {
          post: {
            id: any;
            uid: any;
            title: any;
            preview_image: any;
            created_at: any;
          };
        }) => ({
          id: postRel.post.id,
          uid: postRel.post.uid,
          title: postRel.post.title,
          previewImage: postRel.post.preview_image,
          createdAt: postRel.post.created_at,
        })
      ),
      postsCount: author._count.posts,
    };

    return successResponse(res, transformedAuthor);
  }
);

/**
 * Create new blog author
 * @route POST /api/v3/blog/authors
 * @access Writer, Admin, Superadmin
 */
export const createBlogAuthor = asyncHandler(
  async (req: Request, res: Response) => {
    const authorData = req.body as CreateBlogAuthorInput;

    // Check if author with the same name already exists
    const existingAuthor = await prisma.blogAuthor.findFirst({
      where: { name: authorData.name },
    });

    if (existingAuthor) {
      throw AppError.conflict(
        `Author with name "${authorData.name}" already exists`
      );
    }

    // Create blog author
    const newAuthor = await prisma.blogAuthor.create({
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

    return createdResponse(
      res,
      responseData,
      `/api/v3/blog/authors/${newAuthor.id}`,
      "Blog author created successfully"
    );
  }
);

/**
 * Update blog author
 * @route PUT /api/v3/blog/authors/:id
 * @access Writer, Admin, Superadmin
 */
export const updateBlogAuthor = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const authorId = parseInt(id);
    const updateData = req.body as UpdateBlogAuthorInput;

    if (isNaN(authorId)) {
      throw AppError.badRequest("Invalid author ID");
    }

    // Check if author exists
    const existingAuthor = await prisma.blogAuthor.findUnique({
      where: { id: authorId },
    });

    if (!existingAuthor) {
      throw AppError.notFound("Blog author not found");
    }

    // Check permissions
    if (!hasPermission(req.user!.role, Permission.UPDATE_BLOG_POST)) {
      throw AppError.forbidden("Cannot update blog authors");
    }

    // If name is being updated, check for conflicts
    if (updateData.name && updateData.name !== existingAuthor.name) {
      const nameExists = await prisma.blogAuthor.findFirst({
        where: { name: updateData.name },
      });

      if (nameExists) {
        throw AppError.conflict(
          `Author with name "${updateData.name}" already exists`
        );
      }
    }

    // Update author
    const updatedAuthor = await prisma.blogAuthor.update({
      where: { id: authorId },
      data: {
        ...(updateData.name && { name: updateData.name }),
        ...(updateData.roleSkill && { role_skill: updateData.roleSkill }),
        ...(updateData.xUrl !== undefined && { x_url: updateData.xUrl }),
        ...(updateData.linkedinUrl !== undefined && {
          linkedin_url: updateData.linkedinUrl,
        }),
        ...(updateData.instagramUrl !== undefined && {
          instagram_url: updateData.instagramUrl,
        }),
        ...(updateData.facebookUrl !== undefined && {
          facebook_url: updateData.facebookUrl,
        }),
        ...(updateData.discordUrl !== undefined && {
          discord_url: updateData.discordUrl,
        }),
      },
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

    return successResponse(
      res,
      responseData,
      200,
      "Blog author updated successfully"
    );
  }
);

/**
 * Delete blog author
 * @route DELETE /api/v3/blog/authors/:id
 * @access Writer, Admin, Superadmin
 */
export const deleteBlogAuthor = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const authorId = parseInt(id);

    if (isNaN(authorId)) {
      throw AppError.badRequest("Invalid author ID");
    }

    const author = await prisma.blogAuthor.findUnique({
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
      throw AppError.notFound("Blog author not found");
    }

    // Check permissions
    if (!hasPermission(req.user!.role, Permission.DELETE_BLOG_POST)) {
      throw AppError.forbidden("Cannot delete blog authors");
    }

    // Check if author has posts
    if (author._count.posts > 0) {
      throw AppError.badRequest(
        "Cannot delete author with existing blog posts. Please reassign or delete the posts first."
      );
    }

    // Delete author
    await prisma.blogAuthor.delete({
      where: { id: authorId },
    });

    return successResponse(
      res,
      { id: authorId },
      200,
      "Blog author deleted successfully"
    );
  }
);

export default {
  // Blog Posts
  getBlogPosts,
  getBlogPostById,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,

  // Blog Authors
  getBlogAuthors,
  getBlogAuthorById,
  createBlogAuthor,
  updateBlogAuthor,
  deleteBlogAuthor,
};
