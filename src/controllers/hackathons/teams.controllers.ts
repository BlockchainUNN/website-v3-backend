// src/controllers/hackathons/teams.controllers.ts

import { Request, Response } from "express";
import {
  successResponse,
  createdResponse,
  noContentResponse,
} from "../../lib/response";
import { randomValueHex } from "../../utils/randomValue";
import prisma from "../../../prisma/client";
import { AppError } from "../../lib/error";
import { asyncHandler } from "../../middlewares/errorHandler";

/**
 * Create new team
 * @route POST /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
export const createTeam = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const hackathonId = req.params.id;
  const userEmail = req.user?.email;

  // Validate required fields
  if (!name || name.trim().length === 0) {
    throw AppError.badRequest("Team name is required");
  }

  if (name.length > 50) {
    throw AppError.badRequest("Team name must be 50 characters or less");
  }

  if (!userEmail) {
    throw AppError.unauthorized("User authentication required");
  }

  // Check if hackathon exists
  const hackathon = await prisma.hackathon.findUnique({
    where: { unique_name: hackathonId },
  });

  if (!hackathon) {
    throw AppError.notFound("Hackathon not found");
  }

  // Check if hackathon is still open for team creation
  // const now = new Date();
  // if (now > hackathon.registration_deadline) {
  //   throw AppError.badRequest("Team creation period has ended");
  // }

  // Get hacker registration
  const hacker = await prisma.hacker.findFirst({
    where: {
      user: { email: userEmail },
      hackathon: { unique_name: hackathonId },
    },
  });

  if (!hacker) {
    throw AppError.notFound("User is not registered for this hackathon");
  }

  if (hacker.team_id) {
    throw AppError.conflict("User is already in a team");
  }

  // Check if team name already exists in this hackathon
  const existingTeam = await prisma.team.findFirst({
    where: {
      name: name.trim(),
      hackathon_id: hackathon.id,
    },
  });

  if (existingTeam) {
    throw AppError.conflict("Team name already exists in this hackathon");
  }

  // Create team and assign hacker in a transaction
  const result = await prisma.$transaction(
    async (tx: {
      team: {
        findUnique: (arg0: { where: { invite_code: string } }) => any;
        create: (arg0: {
          data: {
            name: any;
            hackathon_id: any;
            created_by: any;
            invite_code: string;
          };
        }) => any;
      };
      hacker: {
        update: (arg0: {
          where: { id: any };
          data: { team_id: any };
          include: {
            hackathon: {
              select: {
                id: boolean;
                name: boolean;
                unique_name: boolean;
                description: boolean;
                start_date: boolean;
                end_date: boolean;
                registration_deadline: boolean;
              };
            };
            team: { include: { _count: { select: { hackers: boolean } } } };
          };
        }) => any;
      };
    }) => {
      // Generate unique invite code
      let inviteCode: string;
      let codeExists = true;

      do {
        inviteCode = randomValueHex(6).toUpperCase();
        const existingCode = await tx.team.findUnique({
          where: { invite_code: inviteCode },
        });
        codeExists = !!existingCode;
      } while (codeExists);

      // Create team
      const newTeam = await tx.team.create({
        data: {
          name: name.trim(),
          hackathon_id: hackathon.id,
          created_by: hacker.id,
          invite_code: inviteCode,
        },
      });

      // Add hacker to team
      const updatedHacker = await tx.hacker.update({
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
    }
  );

  const responseData = {
    role: result.role,
    registeredAt: result.registered_at,
    hackathon: result.hackathon,
    team: {
      id: result.team!.id,
      name: result.team!.name,
      inviteCode: result.team!.invite_code,
      memberCount: result.team!._count.hackers,
      createdAt: result.team!.created_at,
    },
  };

  return createdResponse(
    res,
    responseData,
    `/api/v3/hackathon/team/${hackathonId}`,
    "Team created successfully"
  );
});

/**
 * Join existing team
 * @route POST /api/v3/hackathon/team/join/:id
 * @access Authenticated Hacker
 */
export const joinTeam = asyncHandler(async (req: Request, res: Response) => {
  const { inviteCode } = req.body;
  const hackathonId = req.params.id;
  const userEmail = req.user?.email;

  // Validate required fields
  if (!inviteCode || inviteCode.trim().length === 0) {
    throw AppError.badRequest("Team invite code is required");
  }

  if (!userEmail) {
    throw AppError.unauthorized("User authentication required");
  }

  // Check if hackathon exists
  const hackathon = await prisma.hackathon.findUnique({
    where: { unique_name: hackathonId },
  });

  if (!hackathon) {
    throw AppError.notFound("Hackathon not found");
  }

  // Check if hackathon is still open for team joining
  // const now = new Date();
  // if (now > hackathon.registration_deadline) {
  //   throw AppError.badRequest("Team joining period has ended");
  // }

  // Get hacker registration
  const hacker = await prisma.hacker.findFirst({
    where: {
      user: { email: userEmail },
      hackathon: { unique_name: hackathonId },
    },
  });

  if (!hacker) {
    throw AppError.notFound("User is not registered for this hackathon");
  }

  if (hacker.team_id) {
    throw AppError.conflict("User is already in a team");
  }

  // Check if team exists and get team info
  const team = await prisma.team.findUnique({
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
    throw AppError.notFound(`Team with invite code "${inviteCode}" not found`);
  }

  // Verify team belongs to the same hackathon
  if (team.hackathon_id !== hackathon.id) {
    throw AppError.badRequest("Team belongs to a different hackathon");
  }

  // Check team size limits (assuming max 4 members per team)
  const maxTeamSize = 4;
  if (team._count.hackers >= maxTeamSize) {
    throw AppError.badRequest(`Team is full (maximum ${maxTeamSize} members)`);
  }

  // Add hacker to team
  const updatedHacker = await prisma.hacker.update({
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
      id: updatedHacker.team!.id,
      name: updatedHacker.team!.name,
      inviteCode: updatedHacker.team!.invite_code,
      memberCount: updatedHacker.team!._count.hackers,
      createdAt: updatedHacker.team!.created_at,
    },
  };

  return successResponse(res, responseData, 200, "Successfully joined team");
});

/**
 * Get team details
 * @route GET /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
export const getTeam = asyncHandler(async (req: Request, res: Response) => {
  const hackathonId = req.params.id;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw AppError.unauthorized("User authentication required");
  }

  // Get hacker registration
  const hacker = await prisma.hacker.findFirst({
    where: {
      hackathon: { unique_name: hackathonId },
      user: { email: userEmail },
    },
  });

  if (!hacker) {
    throw AppError.notFound("User is not registered for this hackathon");
  }

  if (!hacker.team_id) {
    throw AppError.notFound("User is not in any team");
  }

  // Get team details with members
  const team = await prisma.team.findUnique({
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
    throw AppError.notFound("Team not found");
  }

  const responseData = {
    id: team.id,
    name: team.name,
    inviteCode: team.invite_code,
    memberCount: team._count.hackers,
    createdAt: team.created_at,
    hackathon: team.hackathon,
    members: team.hackers.map(
      (member: {
        role: any;
        registered_at: any;
        id: any;
        user: {
          uid: any;
          first_name: any;
          last_name: any;
          email: any;
          sub_community: any;
          tech_skills: any;
          phone_number: any;
          gender: any;
          profile_pic: any;
        };
      }) => ({
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
      })
    ),
  };

  return successResponse(res, responseData);
});

/**
 * Leave team
 * @route DELETE /api/v3/hackathon/team/:id
 * @access Authenticated Hacker
 */
export const leaveTeam = asyncHandler(async (req: Request, res: Response) => {
  const hackathonId = req.params.id;
  const userEmail = req.user?.email;

  if (!userEmail) {
    throw AppError.unauthorized("User authentication required");
  }

  // Get hacker registration
  const hacker = await prisma.hacker.findFirst({
    where: {
      hackathon: { unique_name: hackathonId },
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
    throw AppError.notFound("User is not registered for this hackathon");
  }

  if (!hacker.team_id) {
    throw AppError.badRequest("User is not in any team");
  }

  const team = hacker.team!;

  // Check if hackathon has started (prevent leaving after start)
  const hackathon = await prisma.hackathon.findUnique({
    where: { unique_name: hackathonId },
  });

  if (hackathon && new Date() >= hackathon.start_date) {
    throw AppError.badRequest("Cannot leave team after hackathon has started");
  }

  // Handle team deletion if this is the last member or creator leaving
  await prisma.$transaction(async (tx) => {
    // Remove hacker from team
    await tx.hacker.update({
      where: { id: hacker.id },
      data: { team_id: null },
    });

    // If this was the last member, delete the team
    if (team._count.hackers <= 1) {
      await tx.team.delete({
        where: { id: team.id },
      });
    }
    // If creator is leaving but team has other members, assign new creator
    else if (team.created_by === hacker.id) {
      const remainingMember = await tx.hacker.findFirst({
        where: {
          team_id: team.id,
          id: { not: hacker.id },
        },
        orderBy: { registered_at: "asc" }, // Prisma expects "asc" or "desc"
      });

      if (remainingMember) {
        await tx.team.update({
          where: { id: team.id },
          data: { created_by: remainingMember.id },
        });
      }
    }
  });

  return noContentResponse(res);
});

export default {
  create: createTeam,
  join: joinTeam,
  getTeam,
  leaveTeam,
};
