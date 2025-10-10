"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetUsersQuerySchema = exports.AdminRegistrationSchema = exports.LoginUserSchema = exports.UpdateUserSchema = exports.CreateUserSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
// User creation schema
exports.CreateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: common_schema_1.nameSchema,
        lastName: common_schema_1.nameSchema,
        email: common_schema_1.emailSchema,
        phoneNumber: common_schema_1.phoneSchema,
        gender: zod_1.z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
        subCommunities: zod_1.z.array(zod_1.z.string()).optional(),
        techSkills: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    files: zod_1.z
        .object({
        profilePic: zod_1.z.any().optional(),
    })
        .optional(),
});
// User update schema
exports.UpdateUserSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Invalid user ID"),
    }),
    body: zod_1.z.object({
        firstName: common_schema_1.nameSchema.optional(),
        lastName: common_schema_1.nameSchema.optional(),
        email: common_schema_1.emailSchema.optional(),
        phoneNumber: common_schema_1.phoneSchema,
        gender: zod_1.z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
        subCommunities: zod_1.z.array(zod_1.z.string()).optional(),
        techSkills: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    files: zod_1.z
        .object({
        profilePic: zod_1.z.any().optional(),
    })
        .optional(),
});
// User login schema
exports.LoginUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: common_schema_1.emailSchema,
        password: zod_1.z.string().min(1, "Password is required"),
    }),
});
// Admin registration schema
exports.AdminRegistrationSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: common_schema_1.nameSchema,
        lastName: common_schema_1.nameSchema,
        email: common_schema_1.emailSchema,
        password: common_schema_1.passwordSchema,
    }),
});
// Get users query schema
exports.GetUsersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        search: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(),
        sortBy: zod_1.z.enum(["firstName", "lastName", "email", "created_at"]).optional(),
        sortOrder: zod_1.z.enum(["asc", "desc"]).optional(),
    }),
});
