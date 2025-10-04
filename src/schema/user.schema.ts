import { z } from "zod";
import {
  nameSchema,
  emailSchema,
  phoneSchema,
  passwordSchema,
} from "./common.schema";

// User creation schema
export const CreateUserSchema = z.object({
  body: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    phoneNumber: phoneSchema,
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    subCommunities: z.array(z.string()).optional(),
    techSkills: z.array(z.string()).optional(),
  }),
  files: z
    .object({
      profilePic: z.any().optional(),
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>["body"];

// User update schema
export const UpdateUserSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, "Invalid user ID"),
  }),
  body: z.object({
    firstName: nameSchema.optional(),
    lastName: nameSchema.optional(),
    email: emailSchema.optional(),
    phoneNumber: phoneSchema,
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    subCommunities: z.array(z.string()).optional(),
    techSkills: z.array(z.string()).optional(),
  }),
  files: z
    .object({
      profilePic: z.any().optional(),
    })
    .optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>["body"];

// User login schema
export const LoginUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
  }),
});

export type LoginUserInput = z.infer<typeof LoginUserSchema>["body"];

// Admin registration schema
export const AdminRegistrationSchema = z.object({
  body: z.object({
    firstName: nameSchema,
    lastName: nameSchema,
    email: emailSchema,
    password: passwordSchema,
  }),
});

export type AdminRegistrationInput = z.infer<
  typeof AdminRegistrationSchema
>["body"];

// Get users query schema
export const GetUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().optional(),
    role: z.string().optional(),
    sortBy: z.enum(["firstName", "lastName", "email", "created_at"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export type GetUsersQuery = z.infer<typeof GetUsersQuerySchema>["query"];
