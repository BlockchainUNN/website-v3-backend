// src/controllers/users/users.controllers.ts

import { Request, Response } from "express";
import {
  successResponse,
  paginatedResponse,
  createdResponse,
} from "../../lib/response";
import { calculatePagination } from "../../lib/response";
import { uploadSingleImage } from "../../utils/imageUploadHandler";
import { Permission } from "../../types/api.types";
import { hasPermission } from "../../lib/permissions";
import prisma from "../../../prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../../lib/error";
import { generateTokens } from "../../middlewares/auth";
import { asyncHandler } from "../../middlewares/errorHandler";
import {
  GetUsersQuery,
  CreateUserInput,
  UpdateUserInput,
  AdminRegistrationInput,
  LoginUserInput,
} from "../../schema/user.schema";
import { User } from "@prisma/client";

/**
 * Get all users with pagination and filtering
 * @route GET /api/v3/users
 * @access Admin only
 */
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as GetUsersQuery;
  const {
    page = 1,
    limit = 10,
    search,
    role,
    sortBy = "created_at",
    sortOrder = "desc",
  } = query;

  // Build where clause for filtering
  const where: any = {};

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.roles = { role: role };
  }

  // Get total count for pagination
  const total = await prisma.user.count({ where });

  // Get users with pagination
  const users = await prisma.user.findMany({
    where,
    include: {
      roles: true,
      _count: {
        select: {
          eventAttendee: true,
          event: true,
        },
      },
    },
    orderBy: { [sortBy]: sortOrder },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Transform users for response
  const transformedUsers = users.map((user: any) => ({
    id: user.id,
    uid: user.uid,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.roles?.role || "user",
    subCommunity: user.sub_community,
    techSkills: user.tech_skills,
    phoneNumber: user.phone_number,
    gender: user.gender,
    profilePicId: user.profile_pic,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    stats: {
      eventsAttended: user._count.eventAttendee,
      eventsHosted: user._count.event,
    },
  }));

  const pagination = calculatePagination({ total, page, limit });

  return paginatedResponse(res, transformedUsers, pagination);
});

/**
 * Get user by ID
 * @route GET /api/v3/users/:id
 * @access Admin or Owner
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    throw AppError.badRequest("Invalid user ID");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: true,
      eventAttendee: {
        include: {
          event: {
            select: {
              id: true,
              uid: true,
              name: true,
              start_date: true,
              end_date: true,
            },
          },
        },
      },
      event: {
        select: {
          id: true,
          uid: true,
          name: true,
          start_date: true,
          end_date: true,
          attendees_count: true,
        },
      },
    },
  });

  if (!user) {
    throw AppError.userNotFound(userId);
  }

  // Check if user can access this profile
  const canAccess =
    req.user?.id === userId ||
    hasPermission(req.user!.role, Permission.READ_USER);

  if (!canAccess) {
    throw AppError.forbidden("Cannot access this user profile");
  }

  // Get profile picture if exists
  let profilePicture = null;
  if (user.profile_pic) {
    const image = await prisma.image.findUnique({
      where: { id: user.profile_pic },
      select: { image_url: true, name: true },
    });
    profilePicture = image;
  }

  const transformedUser = {
    id: user.id,
    uid: user.uid,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    role: user.roles?.role || "user",
    subCommunity: user.sub_community,
    techSkills: user.tech_skills,
    phoneNumber: user.phone_number,
    gender: user.gender,
    profilePicture,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    eventsAttended: user.eventAttendee.map((ea: { event: any }) => ea.event),
    eventsHosted: user.event,
  };

  return successResponse(res, transformedUser);
});

/**
 * Create new user (public registration)
 * @route POST /api/v3/users
 * @access Public
 */
export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const userData = req.body as CreateUserInput;
  const profilePic = req.file;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw AppError.emailAlreadyExists(userData.email);
  }

  // Handle profile picture upload
  let uploadedImage = null;
  let profilePicRecord = null;

  if (profilePic) {
    try {
      uploadedImage = await uploadSingleImage(profilePic);
      profilePicRecord = await prisma.image.create({
        data: {
          name: `${userData.firstName} ${userData.lastName} Profile Picture`,
          image_url: uploadedImage.url,
          public_id: uploadedImage.public_id,
        },
      });
    } catch (error) {
      throw AppError.fileUploadError("Failed to upload profile picture", error);
    }
  }

  // Create user
  const newUser = await prisma.user.create({
    data: {
      email: userData.email,
      first_name: userData.firstName,
      last_name: userData.lastName,
      sub_community:
        userData.subCommunities !== undefined
          ? userData.subCommunities
          : undefined,
      tech_skills:
        userData.techSkills !== undefined ? userData.techSkills : undefined,
      phone_number: userData.phoneNumber || null,
      gender: userData.gender || null,
      profile_pic: profilePicRecord?.id || null,
    },
    include: {
      roles: true,
    },
  });

  const responseData = {
    id: newUser.id,
    uid: newUser.uid,
    firstName: newUser.first_name,
    lastName: newUser.last_name,
    email: newUser.email,
    subCommunity: newUser.sub_community,
    techSkills: newUser.tech_skills,
    phoneNumber: newUser.phone_number,
    gender: newUser.gender,
    profilePicture: profilePicRecord
      ? {
          url: profilePicRecord.image_url,
          name: profilePicRecord.name,
        }
      : null,
    createdAt: newUser.created_at,
  };

  return createdResponse(
    res,
    responseData,
    `/api/v3/users/${newUser.id}`,
    "User registered successfully"
  );
});

/**
 * Update user
 * @route PUT /api/v3/users/:id
 * @access Admin or Owner
 */
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt(id);
  const updateData = req.body as UpdateUserInput;
  const profilePic = req.file;

  if (isNaN(userId)) {
    throw AppError.badRequest("Invalid user ID");
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { roles: true },
  });

  if (!existingUser) {
    throw AppError.userNotFound(userId);
  }

  // Check permissions
  const canUpdate =
    req.user?.id === userId ||
    hasPermission(req.user!.role, Permission.UPDATE_USER);

  if (!canUpdate) {
    throw AppError.forbidden("Cannot update this user");
  }

  // If email is being updated, check for conflicts
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: updateData.email },
    });

    if (emailExists) {
      throw AppError.emailAlreadyExists(updateData.email);
    }
  }

  // Handle profile picture upload
  let profilePicRecord = null;
  if (profilePic) {
    try {
      const uploadedImage = await uploadSingleImage(profilePic);
      profilePicRecord = await prisma.image.create({
        data: {
          name: `${updateData.firstName || existingUser.first_name} ${
            updateData.lastName || existingUser.last_name
          } Profile Picture`,
          image_url: uploadedImage.url,
          public_id: uploadedImage.public_id,
        },
      });
    } catch (error) {
      throw AppError.fileUploadError("Failed to upload profile picture", error);
    }
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(updateData.firstName && { first_name: updateData.firstName }),
      ...(updateData.lastName && { last_name: updateData.lastName }),
      ...(updateData.email && { email: updateData.email }),
      ...(updateData.phoneNumber !== undefined && {
        phone_number: updateData.phoneNumber,
      }),
      ...(updateData.gender && { gender: updateData.gender }),
      ...(updateData.subCommunities && {
        sub_community: updateData.subCommunities,
      }),
      ...(updateData.techSkills && { tech_skills: updateData.techSkills }),
      ...(profilePicRecord && { profile_pic: profilePicRecord.id }),
    },
    include: {
      roles: true,
    },
  });

  // Get profile picture
  let profilePicture = null;
  if (updatedUser.profile_pic) {
    const image = await prisma.image.findUnique({
      where: { id: updatedUser.profile_pic },
      select: { image_url: true, name: true },
    });
    profilePicture = image;
  }

  const responseData = {
    id: updatedUser.id,
    uid: updatedUser.uid,
    firstName: updatedUser.first_name,
    lastName: updatedUser.last_name,
    email: updatedUser.email,
    role: updatedUser.roles?.role || "user",
    subCommunity: updatedUser.sub_community,
    techSkills: updatedUser.tech_skills,
    phoneNumber: updatedUser.phone_number,
    gender: updatedUser.gender,
    profilePicture,
    updatedAt: updatedUser.updated_at,
  };

  return successResponse(res, responseData, 200, "User updated successfully");
});

/**
 * Delete user
 * @route DELETE /api/v3/users/:id
 * @access Admin only
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    throw AppError.badRequest("Invalid user ID");
  }

  // Prevent self-deletion
  if (req.user?.id === userId) {
    throw AppError.badRequest("Cannot delete your own account");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw AppError.userNotFound(userId);
  }

  // Delete user (this will cascade to related records based on schema)
  await prisma.user.delete({
    where: { id: userId },
  });

  return successResponse(res, { id: userId }, 200, "User deleted successfully");
});

/**
 * Admin registration with role assignment
 * @route POST /api/v3/admin/register
 * @access Superadmin only
 */
export const registerAdmin = asyncHandler(
  async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } =
      req.body as AdminRegistrationInput;
    const role = "superadmin";

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw AppError.emailAlreadyExists(email);
    }

    // Get or create role
    let userRole = await prisma.role.findUnique({
      where: { role },
    });

    if (!userRole) {
      userRole = await prisma.role.create({
        data: { role },
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create admin user
    const newAdmin = await prisma.user.create({
      data: {
        email,
        first_name: firstName,
        last_name: lastName,
        hashed_password: hashedPassword,
        roleId: userRole.id,
      },
      include: {
        roles: true,
      },
    });

    // Generate tokens
    const tokens = generateTokens(newAdmin);

    const responseData = {
      user: {
        id: newAdmin.id,
        uid: newAdmin.uid,
        firstName: newAdmin.first_name,
        lastName: newAdmin.last_name,
        email: newAdmin.email,
        role: newAdmin.roles?.role,
        createdAt: newAdmin.created_at,
      },
      tokens,
    };

    return createdResponse(
      res,
      responseData,
      `/api/v3/users/${newAdmin.id}`,
      "Admin account created successfully"
    );
  }
);

/**
 * User login
 * @route POST /api/v3/auth/login
 * @access Public
 */
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginUserInput;

  // Find user with password
  const user = await prisma.user.findUnique({
    where: { email },
    include: { roles: true },
  });

  if (!user || !user.hashed_password) {
    throw AppError.invalidCredentials();
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.hashed_password);

  if (!isPasswordValid) {
    throw AppError.invalidCredentials();
  }

  // Generate tokens
  const tokens = generateTokens(user);

  const responseData = {
    user: {
      id: user.id,
      uid: user.uid,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.roles?.role || "user",
      subCommunity: user.sub_community,
      techSkills: user.tech_skills,
      phoneNumber: user.phone_number,
      gender: user.gender,
    },
    tokens,
  };

  return successResponse(res, responseData, 200, "Login successful");
});

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  registerAdmin,
  loginUser,
};
