import { z } from "zod";

// Common field validators
export const emailSchema = z.string().email("Invalid email address");
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format")
  .optional();
export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(50, "Name too long");

export const ParamIdSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid ID format"),
  }),
});

export type ParamId = z.infer<typeof ParamIdSchema>["params"];

export const PaginationQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>["query"];
