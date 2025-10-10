"use strict";
// src/controllers/hackathons/hackers.controllers.ts
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
exports.getLoggedInHacker = exports.getHackerCount = exports.getHackerByEmail = exports.loginHacker = exports.createHacker = void 0;
const response_1 = require("../../lib/response");
const mailHandler_1 = require("../../utils/mailHandler");
const client_1 = __importDefault(require("../../../prisma/client"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const error_1 = require("../../lib/error");
const auth_1 = require("../../middlewares/auth");
const errorHandler_1 = require("../../middlewares/errorHandler");
/**
 * Create new hacker registration
 * @route POST /api/v3/hackers/:id
 * @access Public
 */
exports.createHacker = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, role, password } = req.body;
    const hackathonId = req.params.id;
    // Validate required fields
    if (!email || !role || !password) {
        throw error_1.AppError.badRequest("Email, role, and password are required");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw error_1.AppError.badRequest("Invalid email address format");
    }
    // Validate password strength
    if (password.length < 8) {
        throw error_1.AppError.badRequest("Password must be at least 8 characters long");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { id: Number(hackathonId) },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Check registration deadline
    const now = new Date();
    if (now > hackathon.registration_deadline) {
        throw error_1.AppError.badRequest("Registration deadline has passed");
    }
    // Check if user exists
    const existingUser = yield client_1.default.user.findUnique({
        where: { email },
        include: {
            eventAttendee: true,
        },
    });
    // If there is a connected event, check that the user is regiatered for that event
    if (hackathon.event_id) {
        const isRegistered = Boolean(existingUser === null || existingUser === void 0 ? void 0 : existingUser.eventAttendee.filter((attendee) => Number(attendee.event_id) === Number(hackathon.event_id)).length);
        if (!isRegistered)
            throw error_1.AppError.notFound("Please register for the event first");
    }
    if (!existingUser) {
        throw error_1.AppError.notFound("User with this email not found. Please register for the event first.");
    }
    // Check if hacker already registered for this hackathon
    const existingHacker = yield client_1.default.hacker.findFirst({
        where: {
            user_id: existingUser.id,
            hackathon_id: hackathon.id,
        },
    });
    if (existingHacker) {
        throw error_1.AppError.conflict("User is already registered for this hackathon");
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = yield bcrypt_1.default.hash(password, saltRounds);
    // Create hacker registration
    const newHacker = yield client_1.default.hacker.create({
        data: {
            user_id: existingUser.id,
            hackathon_id: hackathon.id,
            role,
            passwordHash: hashedPassword,
        },
        include: {
            hackathon: {
                select: {
                    id: true,
                    name: true,
                    unique_name: true,
                    description: true,
                    start_date: true,
                    end_date: true,
                    registration_deadline: true,
                },
            },
            user: {
                select: {
                    id: true,
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    sub_community: true,
                    tech_skills: true,
                    phone_number: true,
                    gender: true,
                },
            },
            team: true,
        },
    });
    // Send welcome email
    try {
        yield (0, mailHandler_1.sendMail)(email, `${newHacker.user.first_name}, You're Ready for the Hackathon!`, "hackathon_registeration", { firstName: newHacker.user.first_name });
    }
    catch (emailError) {
        console.warn("Failed to send welcome email:", emailError);
        // Don't fail the registration if email fails
    }
    const responseData = {
        id: newHacker.id,
        role: newHacker.role,
        registeredAt: newHacker.registered_at,
        user: {
            uid: newHacker.user.uid,
            firstName: newHacker.user.first_name,
            lastName: newHacker.user.last_name,
            email: newHacker.user.email,
            subCommunity: newHacker.user.sub_community,
            techSkills: newHacker.user.tech_skills,
            phoneNumber: newHacker.user.phone_number,
            gender: newHacker.user.gender,
        },
        hackathon: newHacker.hackathon,
        team: newHacker.team,
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/hackers/${hackathonId}/${email}`, "Successfully registered for hackathon");
}));
/**
 * Hacker login
 * @route POST /api/v3/hackers/login/:id
 * @access Public
 */
exports.loginHacker = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    const hackathonUid = req.params.id;
    // Validate required fields
    if (!email || !password) {
        throw error_1.AppError.badRequest("Email and password are required");
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw error_1.AppError.badRequest("Invalid email address format");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { unique_name: hackathonUid },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Get user
    const user = yield client_1.default.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw error_1.AppError.invalidCredentials();
    }
    // Check if hacker registration exists
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            user_id: user.id,
            hackathon_id: hackathon.id,
        },
        include: {
            team: true,
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("Hacker registration not found for this hackathon");
    }
    if (!hacker.passwordHash) {
        throw error_1.AppError.badRequest("Password not set for this hacker account");
    }
    // Verify password
    const isPasswordValid = yield bcrypt_1.default.compare(password, hacker.passwordHash);
    if (!isPasswordValid) {
        throw error_1.AppError.invalidCredentials();
    }
    // Generate tokens
    const tokens = (0, auth_1.generateTokens)({
        id: user.id,
        uid: user.uid,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        roles: { role: "hacker" },
    });
    const responseData = {
        tokens,
        userDetails: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            uid: user.uid,
            role: hacker.role,
            registeredAt: hacker.registered_at,
            team: hacker.team,
        },
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Login successful");
}));
/**
 * Get hacker by email
 * @route GET /api/v3/hackers/:id/:email
 * @access Public
 */
exports.getHackerByEmail = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id: hackathonUid, email } = req.params;
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw error_1.AppError.badRequest("Invalid email address format");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { unique_name: hackathonUid },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Get user
    const user = yield client_1.default.user.findUnique({
        where: { email },
    });
    if (!user) {
        throw error_1.AppError.notFound("User with this email not found");
    }
    // Check if hacker registration exists
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            user_id: user.id,
            hackathon_id: hackathon.id,
        },
        include: {
            team: {
                select: {
                    id: true,
                    name: true,
                    invite_code: true,
                    created_at: true,
                },
            },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("Hacker registration not found for this hackathon");
    }
    const responseData = {
        hackerDetails: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            uid: user.uid,
            role: hacker.role,
            registeredAt: hacker.registered_at,
            team: hacker.team,
        },
    };
    return (0, response_1.successResponse)(res, responseData);
}));
/**
 * Get hacker count for hackathon
 * @route GET /api/v3/hackers/count/:id
 * @access Public
 */
exports.getHackerCount = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hackathonUid = req.params.id;
    // Check if hackathon exists and get hacker count
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { unique_name: hackathonUid },
        include: {
            _count: {
                select: {
                    hackers: true,
                },
            },
        },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    const responseData = {
        hackathonId: hackathon.unique_name,
        hackathonName: hackathon.name,
        hackerCount: hackathon._count.hackers,
    };
    return (0, response_1.successResponse)(res, responseData);
}));
/**
 * Get logged-in hacker details
 * @route GET /api/v3/hackers/:id
 * @access Authenticated
 */
exports.getLoggedInHacker = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hackathonUid = req.params.id;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    if (!userEmail) {
        throw error_1.AppError.unauthorized("User authentication required");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { unique_name: hackathonUid },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Get user
    const user = yield client_1.default.user.findUnique({
        where: { email: userEmail },
    });
    if (!user) {
        throw error_1.AppError.notFound("User not found");
    }
    // Check if hacker registration exists
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            user_id: user.id,
            hackathon_id: hackathon.id,
        },
        include: {
            team: {
                include: {
                    hackers: {
                        include: {
                            user: {
                                select: {
                                    uid: true,
                                    first_name: true,
                                    last_name: true,
                                    email: true,
                                    sub_community: true,
                                    tech_skills: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("Hacker registration not found for this hackathon");
    }
    const responseData = {
        hackerDetails: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            uid: user.uid,
            role: hacker.role,
            registeredAt: hacker.registered_at,
            team: hacker.team
                ? {
                    id: hacker.team.id,
                    name: hacker.team.name,
                    inviteCode: hacker.team.invite_code,
                    createdAt: hacker.team.created_at,
                    members: hacker.team.hackers.map((member) => ({
                        role: member.role,
                        user: {
                            uid: member.user.uid,
                            firstName: member.user.first_name,
                            lastName: member.user.last_name,
                            email: member.user.email,
                            subCommunity: member.user.sub_community,
                            techSkills: member.user.tech_skills,
                        },
                    })),
                }
                : null,
        },
    };
    return (0, response_1.successResponse)(res, responseData);
}));
exports.default = {
    create: exports.createHacker,
    login: exports.loginHacker,
    getHacker: exports.getHackerByEmail,
    getHackerCount: exports.getHackerCount,
    getLoggedInHacker: exports.getLoggedInHacker,
};
