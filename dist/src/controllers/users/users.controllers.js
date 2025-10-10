"use strict";
// src/controllers/users/users.controllers.ts
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
exports.loginUser = exports.registerAdmin = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const response_1 = require("../../lib/response");
const response_2 = require("../../lib/response");
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const api_types_1 = require("../../types/api.types");
const permissions_1 = require("../../lib/permissions");
const client_1 = __importDefault(require("../../../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const error_1 = require("../../lib/error");
const auth_1 = require("../../middlewares/auth");
const errorHandler_1 = require("../../middlewares/errorHandler");
/**
 * Get all users with pagination and filtering
 * @route GET /api/v3/users
 * @access Admin only
 */
exports.getUsers = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const { page = 1, limit = 10, search, role, sortBy = "created_at", sortOrder = "desc", } = query;
    // Build where clause for filtering
    const where = {};
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
    const total = yield client_1.default.user.count({ where });
    // Get users with pagination
    const users = yield client_1.default.user.findMany({
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
    const transformedUsers = users.map((user) => {
        var _a;
        return ({
            id: user.id,
            uid: user.uid,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || "user",
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
        });
    });
    const pagination = (0, response_2.calculatePagination)({ total, page, limit });
    return (0, response_1.paginatedResponse)(res, transformedUsers, pagination);
}));
/**
 * Get user by ID
 * @route GET /api/v3/users/:id
 * @access Admin or Owner
 */
exports.getUserById = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
        throw error_1.AppError.badRequest("Invalid user ID");
    }
    const user = yield client_1.default.user.findUnique({
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
        throw error_1.AppError.userNotFound(userId);
    }
    // Check if user can access this profile
    const canAccess = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === userId ||
        (0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.READ_USER);
    if (!canAccess) {
        throw error_1.AppError.forbidden("Cannot access this user profile");
    }
    // Get profile picture if exists
    let profilePicture = null;
    if (user.profile_pic) {
        const image = yield client_1.default.image.findUnique({
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
        role: ((_b = user.roles) === null || _b === void 0 ? void 0 : _b.role) || "user",
        subCommunity: user.sub_community,
        techSkills: user.tech_skills,
        phoneNumber: user.phone_number,
        gender: user.gender,
        profilePicture,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        eventsAttended: user.eventAttendee.map((ea) => ea.event),
        eventsHosted: user.event,
    };
    return (0, response_1.successResponse)(res, transformedUser);
}));
/**
 * Create new user (public registration)
 * @route POST /api/v3/users
 * @access Public
 */
exports.createUser = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = req.body;
    const profilePic = req.file;
    // Check if user already exists
    const existingUser = yield client_1.default.user.findUnique({
        where: { email: userData.email },
    });
    if (existingUser) {
        throw error_1.AppError.emailAlreadyExists(userData.email);
    }
    // Handle profile picture upload
    let uploadedImage = null;
    let profilePicRecord = null;
    if (profilePic) {
        try {
            uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(profilePic);
            profilePicRecord = yield client_1.default.image.create({
                data: {
                    name: `${userData.firstName} ${userData.lastName} Profile Picture`,
                    image_url: uploadedImage.url,
                    public_id: uploadedImage.public_id,
                },
            });
        }
        catch (error) {
            throw error_1.AppError.fileUploadError("Failed to upload profile picture", error);
        }
    }
    // Create user
    const newUser = yield client_1.default.user.create({
        data: {
            email: userData.email,
            first_name: userData.firstName,
            last_name: userData.lastName,
            sub_community: userData.subCommunities !== undefined
                ? userData.subCommunities
                : undefined,
            tech_skills: userData.techSkills !== undefined ? userData.techSkills : undefined,
            phone_number: userData.phoneNumber || null,
            gender: userData.gender || null,
            profile_pic: (profilePicRecord === null || profilePicRecord === void 0 ? void 0 : profilePicRecord.id) || null,
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
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/users/${newUser.id}`, "User registered successfully");
}));
/**
 * Update user
 * @route PUT /api/v3/users/:id
 * @access Admin or Owner
 */
exports.updateUser = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const userId = parseInt(id);
    const updateData = req.body;
    const profilePic = req.file;
    if (isNaN(userId)) {
        throw error_1.AppError.badRequest("Invalid user ID");
    }
    // Check if user exists
    const existingUser = yield client_1.default.user.findUnique({
        where: { id: userId },
        include: { roles: true },
    });
    if (!existingUser) {
        throw error_1.AppError.userNotFound(userId);
    }
    // Check permissions
    const canUpdate = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === userId ||
        (0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.UPDATE_USER);
    if (!canUpdate) {
        throw error_1.AppError.forbidden("Cannot update this user");
    }
    // If email is being updated, check for conflicts
    if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = yield client_1.default.user.findUnique({
            where: { email: updateData.email },
        });
        if (emailExists) {
            throw error_1.AppError.emailAlreadyExists(updateData.email);
        }
    }
    // Handle profile picture upload
    let profilePicRecord = null;
    if (profilePic) {
        try {
            const uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(profilePic);
            profilePicRecord = yield client_1.default.image.create({
                data: {
                    name: `${updateData.firstName || existingUser.first_name} ${updateData.lastName || existingUser.last_name} Profile Picture`,
                    image_url: uploadedImage.url,
                    public_id: uploadedImage.public_id,
                },
            });
        }
        catch (error) {
            throw error_1.AppError.fileUploadError("Failed to upload profile picture", error);
        }
    }
    // Update user
    const updatedUser = yield client_1.default.user.update({
        where: { id: userId },
        data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (updateData.firstName && { first_name: updateData.firstName })), (updateData.lastName && { last_name: updateData.lastName })), (updateData.email && { email: updateData.email })), (updateData.phoneNumber !== undefined && {
            phone_number: updateData.phoneNumber,
        })), (updateData.gender && { gender: updateData.gender })), (updateData.subCommunities && {
            sub_community: updateData.subCommunities,
        })), (updateData.techSkills && { tech_skills: updateData.techSkills })), (profilePicRecord && { profile_pic: profilePicRecord.id })),
        include: {
            roles: true,
        },
    });
    // Get profile picture
    let profilePicture = null;
    if (updatedUser.profile_pic) {
        const image = yield client_1.default.image.findUnique({
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
        role: ((_b = updatedUser.roles) === null || _b === void 0 ? void 0 : _b.role) || "user",
        subCommunity: updatedUser.sub_community,
        techSkills: updatedUser.tech_skills,
        phoneNumber: updatedUser.phone_number,
        gender: updatedUser.gender,
        profilePicture,
        updatedAt: updatedUser.updated_at,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "User updated successfully");
}));
/**
 * Delete user
 * @route DELETE /api/v3/users/:id
 * @access Admin only
 */
exports.deleteUser = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const userId = parseInt(id);
    if (isNaN(userId)) {
        throw error_1.AppError.badRequest("Invalid user ID");
    }
    // Prevent self-deletion
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === userId) {
        throw error_1.AppError.badRequest("Cannot delete your own account");
    }
    const user = yield client_1.default.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw error_1.AppError.userNotFound(userId);
    }
    // Delete user (this will cascade to related records based on schema)
    yield client_1.default.user.delete({
        where: { id: userId },
    });
    return (0, response_1.successResponse)(res, { id: userId }, 200, "User deleted successfully");
}));
/**
 * Admin registration with role assignment
 * @route POST /api/v3/admin/register
 * @access Superadmin only
 */
exports.registerAdmin = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { firstName, lastName, email, password } = req.body;
    const role = "superadmin";
    // Check if user already exists
    const existingUser = yield client_1.default.user.findUnique({
        where: { email },
    });
    if (existingUser) {
        throw error_1.AppError.emailAlreadyExists(email);
    }
    // Get or create role
    let userRole = yield client_1.default.role.findUnique({
        where: { role },
    });
    if (!userRole) {
        userRole = yield client_1.default.role.create({
            data: { role },
        });
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
    // Create admin user
    const newAdmin = yield client_1.default.user.create({
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
    const tokens = (0, auth_1.generateTokens)(newAdmin);
    const responseData = {
        user: {
            id: newAdmin.id,
            uid: newAdmin.uid,
            firstName: newAdmin.first_name,
            lastName: newAdmin.last_name,
            email: newAdmin.email,
            role: (_a = newAdmin.roles) === null || _a === void 0 ? void 0 : _a.role,
            createdAt: newAdmin.created_at,
        },
        tokens,
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/users/${newAdmin.id}`, "Admin account created successfully");
}));
/**
 * User login
 * @route POST /api/v3/auth/login
 * @access Public
 */
exports.loginUser = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { email, password } = req.body;
    // Find user with password
    const user = yield client_1.default.user.findUnique({
        where: { email },
        include: { roles: true },
    });
    if (!user || !user.hashed_password) {
        throw error_1.AppError.invalidCredentials();
    }
    // Verify password
    const isPasswordValid = yield bcrypt_1.default.compare(password, user.hashed_password);
    if (!isPasswordValid) {
        throw error_1.AppError.invalidCredentials();
    }
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)(user);
    const responseData = {
        user: {
            id: user.id,
            uid: user.uid,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            role: ((_a = user.roles) === null || _a === void 0 ? void 0 : _a.role) || "user",
            subCommunity: user.sub_community,
            techSkills: user.tech_skills,
            phoneNumber: user.phone_number,
            gender: user.gender,
        },
        tokens,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Login successful");
}));
exports.default = {
    getUsers: exports.getUsers,
    getUserById: exports.getUserById,
    createUser: exports.createUser,
    updateUser: exports.updateUser,
    deleteUser: exports.deleteUser,
    registerAdmin: exports.registerAdmin,
    loginUser: exports.loginUser,
};
