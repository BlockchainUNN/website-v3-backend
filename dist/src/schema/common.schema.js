"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationQuerySchema = exports.ParamIdSchema = exports.nameSchema = exports.phoneSchema = exports.passwordSchema = exports.emailSchema = void 0;
const zod_1 = require("zod");
// Common field validators
exports.emailSchema = zod_1.z.string().email("Invalid email address");
exports.passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character");
exports.phoneSchema = zod_1.z
    .string()
    .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
    .optional();
exports.nameSchema = zod_1.z
    .string()
    .min(1, "Name is required")
    .max(50, "Name too long");
exports.ParamIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^\d+$/, "Invalid ID format"),
    }),
});
exports.PaginationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
        limit: zod_1.z.string().regex(/^\d+$/).transform(Number).optional(),
    }),
});
