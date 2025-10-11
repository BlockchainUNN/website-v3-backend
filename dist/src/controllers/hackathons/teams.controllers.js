"use strict";
// src/controllers/hackathons/teams.controllers.ts
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
exports.leaveTeam = exports.getTeam = exports.joinTeam = exports.createTeam = void 0;
const response_1 = require("../../lib/response");
const randomValue_1 = require("../../utils/randomValue");
const client_1 = __importDefault(require("../../../prisma/client"));
const error_1 = require("../../lib/error");
const errorHandler_1 = require("../../middlewares/errorHandler");
/**
 * Create new team
 * @route POST /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
exports.createTeam = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name } = req.body;
    const hackathonId = req.params.id;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    // Validate required fields
    if (!name || name.trim().length === 0) {
        throw error_1.AppError.badRequest("Team name is required");
    }
    if (name.length > 50) {
        throw error_1.AppError.badRequest("Team name must be 50 characters or less");
    }
    if (!userEmail) {
        throw error_1.AppError.unauthorized("User authentication required");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { id: Number(hackathonId) },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Check if hackathon is still open for team creation
    // const now = new Date();
    // if (now > hackathon.registration_deadline) {
    //   throw AppError.badRequest("Team creation period has ended");
    // }
    // Get hacker registration
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            user: { email: userEmail },
            hackathon: { id: Number(hackathonId) },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("User is not registered for this hackathon");
    }
    if (hacker.team_id) {
        throw error_1.AppError.conflict("User is already in a team");
    }
    // Check if team name already exists in this hackathon
    const existingTeam = yield client_1.default.team.findFirst({
        where: {
            name: name.trim(),
            hackathon_id: hackathon.id,
        },
    });
    if (existingTeam) {
        throw error_1.AppError.conflict("Team name already exists in this hackathon");
    }
    // Create team and assign hacker in a transaction
    const result = yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Generate unique invite code
        let inviteCode;
        let codeExists = true;
        do {
            inviteCode = (0, randomValue_1.randomValueHex)(6).toUpperCase();
            const existingCode = yield tx.team.findUnique({
                where: { invite_code: inviteCode },
            });
            codeExists = !!existingCode;
        } while (codeExists);
        // Create team
        const newTeam = yield tx.team.create({
            data: {
                name: name.trim(),
                hackathon_id: hackathon.id,
                created_by: hacker.id,
                invite_code: inviteCode,
            },
        });
        // Add hacker to team
        const updatedHacker = yield tx.hacker.update({
            where: { id: hacker.id },
            data: { team_id: newTeam.id },
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
                team: {
                    include: {
                        _count: {
                            select: {
                                hackers: true,
                            },
                        },
                    },
                },
            },
        });
        return updatedHacker;
    }));
    const responseData = {
        role: result.role,
        registeredAt: result.registered_at,
        hackathon: result.hackathon,
        team: {
            id: result.team.id,
            name: result.team.name,
            inviteCode: result.team.invite_code,
            memberCount: result.team._count.hackers,
            createdAt: result.team.created_at,
        },
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/hackathon/team/${hackathonId}`, "Team created successfully");
}));
/**
 * Join existing team
 * @route POST /api/v3/hackathon/team/join/:id
 * @access Authenticated Hacker
 */
exports.joinTeam = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { inviteCode } = req.body;
    const hackathonId = req.params.id;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    // Validate required fields
    if (!inviteCode || inviteCode.trim().length === 0) {
        throw error_1.AppError.badRequest("Team invite code is required");
    }
    if (!userEmail) {
        throw error_1.AppError.unauthorized("User authentication required");
    }
    // Check if hackathon exists
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { id: Number(hackathonId) },
    });
    if (!hackathon) {
        throw error_1.AppError.notFound("Hackathon not found");
    }
    // Check if hackathon is still open for team joining
    // const now = new Date();
    // if (now > hackathon.registration_deadline) {
    //   throw AppError.badRequest("Team joining period has ended");
    // }
    // Get hacker registration
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            user: { email: userEmail },
            hackathon: { id: Number(hackathonId) },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("User is not registered for this hackathon");
    }
    if (hacker.team_id) {
        throw error_1.AppError.conflict("User is already in a team");
    }
    // Check if team exists and get team info
    const team = yield client_1.default.team.findUnique({
        where: { invite_code: inviteCode.toUpperCase() },
        include: {
            hackathon: true,
            _count: {
                select: {
                    hackers: true,
                },
            },
        },
    });
    if (!team) {
        throw error_1.AppError.notFound(`Team with invite code "${inviteCode}" not found`);
    }
    // Verify team belongs to the same hackathon
    if (team.hackathon_id !== hackathon.id) {
        throw error_1.AppError.badRequest("Team belongs to a different hackathon");
    }
    // Check team size limits (assuming max 4 members per team)
    const maxTeamSize = 4;
    if (team._count.hackers >= maxTeamSize) {
        throw error_1.AppError.badRequest(`Team is full (maximum ${maxTeamSize} members)`);
    }
    // Add hacker to team
    const updatedHacker = yield client_1.default.hacker.update({
        where: { id: hacker.id },
        data: { team_id: team.id },
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
            team: {
                include: {
                    _count: {
                        select: {
                            hackers: true,
                        },
                    },
                },
            },
        },
    });
    const responseData = {
        role: updatedHacker.role,
        registeredAt: updatedHacker.registered_at,
        hackathon: updatedHacker.hackathon,
        team: {
            id: updatedHacker.team.id,
            name: updatedHacker.team.name,
            inviteCode: updatedHacker.team.invite_code,
            memberCount: updatedHacker.team._count.hackers,
            createdAt: updatedHacker.team.created_at,
        },
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Successfully joined team");
}));
/**
 * Get team details
 * @route GET /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
exports.getTeam = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hackathonId = req.params.id;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    if (!userEmail) {
        throw error_1.AppError.unauthorized("User authentication required");
    }
    // Get hacker registration
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            hackathon: { id: Number(hackathonId) },
            user: { email: userEmail },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("User is not registered for this hackathon");
    }
    if (!hacker.team_id) {
        throw error_1.AppError.notFound("User is not in any team");
    }
    // Get team details with members
    const team = yield client_1.default.team.findUnique({
        where: { id: hacker.team_id },
        include: {
            hackathon: {
                select: {
                    id: true,
                    name: true,
                    unique_name: true,
                    description: true,
                    start_date: true,
                    end_date: true,
                },
            },
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
                            phone_number: true,
                            gender: true,
                            profile_pic: true,
                        },
                    },
                },
                orderBy: {
                    registered_at: "asc", // Show team creator first
                },
            },
            _count: {
                select: {
                    hackers: true,
                },
            },
        },
    });
    if (!team) {
        throw error_1.AppError.notFound("Team not found");
    }
    const responseData = {
        id: team.id,
        name: team.name,
        inviteCode: team.invite_code,
        memberCount: team._count.hackers,
        createdAt: team.created_at,
        hackathon: team.hackathon,
        members: team.hackers.map((member) => ({
            role: member.role,
            registeredAt: member.registered_at,
            isCreator: member.id === team.created_by,
            user: {
                uid: member.user.uid,
                firstName: member.user.first_name,
                lastName: member.user.last_name,
                email: member.user.email,
                subCommunity: member.user.sub_community,
                techSkills: member.user.tech_skills,
                phoneNumber: member.user.phone_number,
                gender: member.user.gender,
                profilePicId: member.user.profile_pic,
            },
        })),
    };
    return (0, response_1.successResponse)(res, responseData);
}));
/**
 * Leave team
 * @route DELETE /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
exports.leaveTeam = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const hackathonId = req.params.id;
    const userEmail = (_a = req.user) === null || _a === void 0 ? void 0 : _a.email;
    if (!userEmail) {
        throw error_1.AppError.unauthorized("User authentication required");
    }
    // Get hacker registration
    const hacker = yield client_1.default.hacker.findFirst({
        where: {
            hackathon: { id: Number(hackathonId) },
            user: { email: userEmail },
        },
        include: {
            team: {
                include: {
                    _count: {
                        select: {
                            hackers: true,
                        },
                    },
                },
            },
        },
    });
    if (!hacker) {
        throw error_1.AppError.notFound("User is not registered for this hackathon");
    }
    if (!hacker.team_id) {
        throw error_1.AppError.badRequest("User is not in any team");
    }
    const team = hacker.team;
    // Check if hackathon has started (prevent leaving after start)
    const hackathon = yield client_1.default.hackathon.findUnique({
        where: { id: Number(hackathonId) },
    });
    if (hackathon && new Date() >= hackathon.start_date) {
        throw error_1.AppError.badRequest("Cannot leave team after hackathon has started");
    }
    // Handle team deletion if this is the last member or creator leaving
    yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Remove hacker from team
        yield tx.hacker.update({
            where: { id: hacker.id },
            data: { team_id: null },
        });
        // If this was the last member, delete the team
        if (team._count.hackers <= 1) {
            yield tx.team.delete({
                where: { id: team.id },
            });
        }
        // If creator is leaving but team has other members, assign new creator
        else if (team.created_by === hacker.id) {
            const remainingMember = yield tx.hacker.findFirst({
                where: {
                    team_id: team.id,
                    id: { not: hacker.id },
                },
                orderBy: { registered_at: "asc" }, // Prisma expects "asc" or "desc"
            });
            if (remainingMember) {
                yield tx.team.update({
                    where: { id: team.id },
                    data: { created_by: remainingMember.id },
                });
            }
        }
    }));
    return (0, response_1.noContentResponse)(res);
}));
exports.default = {
    create: exports.createTeam,
    join: exports.joinTeam,
    getTeam: exports.getTeam,
    leaveTeam: exports.leaveTeam,
};
