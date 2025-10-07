// src/controllers/hackathons/hackers.controllers.ts

import { Request, Response } from "express";
import { successResponse, createdResponse } from "../../lib/response";
import { sendMail } from "../../utils/mailHandler";
import prisma from "../../../prisma/client";
import bcrypt from "bcrypt";
import { AppError } from "../../lib/error";
import { generateTokens } from "../../middlewares/auth";
import { asyncHandler } from "../../middlewares/errorHandler";

/**
 * Create new hacker registration
 * @route POST /api/v3/hackers/:id
 * @access Public
 */
export const createHacker = asyncHandler(
  async (req: Request, res: Response) => {
    const { email, role, password } = req.body;
    const hackathonId = req.params.id;

    // Validate required fields
    if (!email || !role || !password) {
      throw AppError.badRequest("Email, role, and password are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest("Invalid email address format");
    }

    // Validate password strength
    if (password.length < 8) {
      throw AppError.badRequest("Password must be at least 8 characters long");
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { id: Number(hackathonId) },
    });

    if (!hackathon) {
      throw AppError.notFound("Hackathon not found");
    }

    // Check registration deadline
    const now = new Date();
    if (now > hackathon.registration_deadline) {
      throw AppError.badRequest("Registration deadline has passed");
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        eventAttendee: true,
      },
    });

    // If there is a connected event, check that the user is regiatered for that event
    if (hackathon.event_id) {
      const isRegistered = Boolean(
        existingUser?.eventAttendee.filter(
          (attendee) => Number(attendee.event_id) === Number(hackathon.event_id)
        ).length
      );

      if (!isRegistered)
        throw AppError.notFound("Please register for the event first");
    }

    if (!existingUser) {
      throw AppError.notFound(
        "User with this email not found. Please register for the event first."
      );
    }

    // Check if hacker already registered for this hackathon
    const existingHacker = await prisma.hacker.findFirst({
      where: {
        user_id: existingUser.id,
        hackathon_id: hackathon.id,
      },
    });

    if (existingHacker) {
      throw AppError.conflict("User is already registered for this hackathon");
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create hacker registration
    const newHacker = await prisma.hacker.create({
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
      await sendMail(
        email,
        `${newHacker.user.first_name}, You're Ready for the Hackathon!`,
        "hackathon_registeration",
        { firstName: newHacker.user.first_name }
      );
    } catch (emailError) {
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

    return createdResponse(
      res,
      responseData,
      `/api/v3/hackers/${hackathonId}/${email}`,
      "Successfully registered for hackathon"
    );
  }
);

/**
 * Hacker login
 * @route POST /api/v3/hackers/login/:id
 * @access Public
 */
export const loginHacker = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const hackathonUid = req.params.id;

  // Validate required fields
  if (!email || !password) {
    throw AppError.badRequest("Email and password are required");
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw AppError.badRequest("Invalid email address format");
  }

  // Check if hackathon exists
  const hackathon = await prisma.hackathon.findUnique({
    where: { unique_name: hackathonUid },
  });

  if (!hackathon) {
    throw AppError.notFound("Hackathon not found");
  }

  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw AppError.invalidCredentials();
  }

  // Check if hacker registration exists
  const hacker = await prisma.hacker.findFirst({
    where: {
      user_id: user.id,
      hackathon_id: hackathon.id,
    },
    include: {
      team: true,
    },
  });

  if (!hacker) {
    throw AppError.notFound("Hacker registration not found for this hackathon");
  }

  if (!hacker.passwordHash) {
    throw AppError.badRequest("Password not set for this hacker account");
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, hacker.passwordHash);

  if (!isPasswordValid) {
    throw AppError.invalidCredentials();
  }

  // Generate tokens
  const tokens = generateTokens({
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

  return successResponse(res, responseData, 200, "Login successful");
});

/**
 * Get hacker by email
 * @route GET /api/v3/hackers/:id/:email
 * @access Public
 */
export const getHackerByEmail = asyncHandler(
  async (req: Request, res: Response) => {
    const { id: hackathonUid, email } = req.params;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw AppError.badRequest("Invalid email address format");
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonUid },
    });

    if (!hackathon) {
      throw AppError.notFound("Hackathon not found");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw AppError.notFound("User with this email not found");
    }

    // Check if hacker registration exists
    const hacker = await prisma.hacker.findFirst({
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
      throw AppError.notFound(
        "Hacker registration not found for this hackathon"
      );
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

    return successResponse(res, responseData);
  }
);

/**
 * Get hacker count for hackathon
 * @route GET /api/v3/hackers/count/:id
 * @access Public
 */
export const getHackerCount = asyncHandler(
  async (req: Request, res: Response) => {
    const hackathonUid = req.params.id;

    // Check if hackathon exists and get hacker count
    const hackathon = await prisma.hackathon.findUnique({
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
      throw AppError.notFound("Hackathon not found");
    }

    const responseData = {
      hackathonId: hackathon.unique_name,
      hackathonName: hackathon.name,
      hackerCount: hackathon._count.hackers,
    };

    return successResponse(res, responseData);
  }
);

/**
 * Get logged-in hacker details
 * @route GET /api/v3/hackers/:id
 * @access Authenticated
 */
export const getLoggedInHacker = asyncHandler(
  async (req: Request, res: Response) => {
    const hackathonUid = req.params.id;
    const userEmail = req.user?.email;

    if (!userEmail) {
      throw AppError.unauthorized("User authentication required");
    }

    // Check if hackathon exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonUid },
    });

    if (!hackathon) {
      throw AppError.notFound("Hackathon not found");
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    });

    if (!user) {
      throw AppError.notFound("User not found");
    }

    // Check if hacker registration exists
    const hacker = await prisma.hacker.findFirst({
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
      throw AppError.notFound(
        "Hacker registration not found for this hackathon"
      );
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
              members: hacker.team.hackers.map(
                (member: {
                  role: any;
                  user: {
                    uid: any;
                    first_name: any;
                    last_name: any;
                    email: any;
                    sub_community: any;
                    tech_skills: any;
                  };
                }) => ({
                  role: member.role,
                  user: {
                    uid: member.user.uid,
                    firstName: member.user.first_name,
                    lastName: member.user.last_name,
                    email: member.user.email,
                    subCommunity: member.user.sub_community,
                    techSkills: member.user.tech_skills,
                  },
                })
              ),
            }
          : null,
      },
    };

    return successResponse(res, responseData);
  }
);

export default {
  create: createHacker,
  login: loginHacker,
  getHacker: getHackerByEmail,
  getHackerCount,
  getLoggedInHacker,
};
