"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlogPostsQuerySchema = exports.UpdateBlogAuthorSchema = exports.CreateBlogAuthorSchema = exports.UpdateBlogPostSchema = exports.CreateBlogPostSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const common_schema_1 = require("./common.schema");
exports.CreateBlogPostSchema = zod_1.default.object({
    body: zod_1.default.object({
        title: zod_1.default.string().min(1, "Title is required").max(200, "Title too long"),
        content: zod_1.default.string().min(1, "Content is required"),
        authorIds: zod_1.default
            .array(zod_1.default.number().int().positive())
            .min(1, "At least one author is required"),
    }),
    files: zod_1.default.object({
        previewImage: zod_1.default
            .any()
            .refine((file) => file != null, "Preview image is required"),
    }),
});
exports.UpdateBlogPostSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().regex(/^\d+$/, "Invalid blog post ID"),
    }),
    body: zod_1.default.object({
        title: zod_1.default
            .string()
            .min(1, "Title is required")
            .max(200, "Title too long")
            .optional(),
        content: zod_1.default.string().min(1, "Content is required").optional(),
        authorIds: zod_1.default
            .array(zod_1.default.number().int().positive())
            .min(1, "At least one author is required")
            .optional(),
    }),
    files: zod_1.default
        .object({
        previewImage: zod_1.default.any().optional(),
    })
        .optional(),
});
exports.CreateBlogAuthorSchema = zod_1.default.object({
    body: zod_1.default.object({
        name: common_schema_1.nameSchema,
        roleSkill: zod_1.default.string().min(1, "Role/skill is required"),
        xUrl: zod_1.default.string().url().optional(),
        linkedinUrl: zod_1.default.string().url().optional(),
        instagramUrl: zod_1.default.string().url().optional(),
        facebookUrl: zod_1.default.string().url().optional(),
        discordUrl: zod_1.default.string().url().optional(),
    }),
});
exports.UpdateBlogAuthorSchema = zod_1.default.object({
    params: zod_1.default.object({
        id: zod_1.default.string().regex(/^\d+$/, "Invalid author ID"),
    }),
    body: zod_1.default.object({
        name: common_schema_1.nameSchema.optional(),
        roleSkill: zod_1.default.string().min(1, "Role/skill is required").optional(),
        xUrl: zod_1.default.string().url().optional(),
        linkedinUrl: zod_1.default.string().url().optional(),
        instagramUrl: zod_1.default.string().url().optional(),
        facebookUrl: zod_1.default.string().url().optional(),
        discordUrl: zod_1.default.string().url().optional(),
    }),
});
exports.GetBlogPostsQuerySchema = zod_1.default.object({
    query: zod_1.default.object({
        page: zod_1.default.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.default.string().regex(/^\d+$/).transform(Number).optional(),
        search: zod_1.default.string().optional(),
        authorId: zod_1.default.string().regex(/^\d+$/).transform(Number).optional(),
        sortBy: zod_1.default.enum(["title", "created_at", "updated_at"]).optional(),
        sortOrder: zod_1.default.enum(["asc", "desc"]).optional(),
    }),
});
