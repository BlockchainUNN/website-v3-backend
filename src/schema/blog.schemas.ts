import z from "zod";
import { nameSchema } from "./common.schema";

export const CreateBlogPostSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Title is required").max(200, "Title too long"),
    content: z.string().min(1, "Content is required"),
    authorIds: z
      .array(z.number().int().positive())
      .min(1, "At least one author is required"),
  }),
  files: z.object({
    previewImage: z
      .any()
      .refine((file) => file != null, "Preview image is required"),
  }),
});

export type CreateBlogPostInput = z.infer<typeof CreateBlogPostSchema>["body"];

export const UpdateBlogPostSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid blog post ID"),
  }),
  body: z.object({
    title: z
      .string()
      .min(1, "Title is required")
      .max(200, "Title too long")
      .optional(),
    content: z.string().min(1, "Content is required").optional(),
    authorIds: z
      .array(z.number().int().positive())
      .min(1, "At least one author is required")
      .optional(),
  }),
  files: z
    .object({
      previewImage: z.any().optional(),
    })
    .optional(),
});

export type UpdateBlogPostInput = z.infer<typeof UpdateBlogPostSchema>["body"];

export const CreateBlogAuthorSchema = z.object({
  body: z.object({
    name: nameSchema,
    roleSkill: z.string().min(1, "Role/skill is required"),
    xUrl: z.string().url().optional(),
    linkedinUrl: z.string().url().optional(),
    instagramUrl: z.string().url().optional(),
    facebookUrl: z.string().url().optional(),
    discordUrl: z.string().url().optional(),
  }),
});

export type CreateBlogAuthorInput = z.infer<
  typeof CreateBlogAuthorSchema
>["body"];

export const UpdateBlogAuthorSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid author ID"),
  }),
  body: z.object({
    name: nameSchema.optional(),
    roleSkill: z.string().min(1, "Role/skill is required").optional(),
    xUrl: z.string().url().optional(),
    linkedinUrl: z.string().url().optional(),
    instagramUrl: z.string().url().optional(),
    facebookUrl: z.string().url().optional(),
    discordUrl: z.string().url().optional(),
  }),
});

export type UpdateBlogAuthorInput = z.infer<
  typeof UpdateBlogAuthorSchema
>["body"];

export const GetBlogPostsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    authorId: z.string().regex(/^\d+$/).transform(Number).optional(),
    sortBy: z.enum(["title", "created_at", "updated_at"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export type GetBlogPostsQuery = z.infer<
  typeof GetBlogPostsQuerySchema
>["query"];
