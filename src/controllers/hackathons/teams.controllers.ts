import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import { randomValueHex } from "../../utils/randomValue";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = "Endpoint for creating a team"
  // #swagger.security = [{"apiKeyAuth": []}]
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is creating a team for", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Team Name", schema: {name: "Team Alpha"}}
    const { name } = req.body;
    const hackathonId = req.params?.id;
    const user = req.user;

    // Validate user data
    if (!name)
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'No name was given', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "No name was given");

    // Check if event exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonId },
    });
    if (!hackathon) return errorResponse(res, 404, "Hackathon not found");

    // Check if user is in another team.
    const hacker = await prisma.hacker.findFirst({
      where: {
        user: { email: user.email },
        hackathon: { unique_name: hackathonId },
      },
    });
    if (!hacker)
      return errorResponse(
        res,
        404,
        "User is not registered for this hackathon"
      );
    if (hacker.team_id)
      return errorResponse(res, 400, "Hacker is already registered for a Team");

    // Create random 6-Characters. and the team
    const teamCode = randomValueHex(6);
    const newTeam = await prisma.team.create({
      data: {
        name,
        hackathon_id: hackathon.id,
        created_by: hacker.id,
        invite_code: teamCode,
      },
    });

    // Add hacker to team
    const updatedHacker = await prisma.hacker.update({
      where: { id: hacker.id },
      data: { team_id: newTeam.id },
      include: {
        hackathon: {
          select: {
            name: true,
            description: true,
            unique_name: true,
            start_date: true,
            registration_deadline: true,
          },
        },
        team: true,
      },
    });

    // #swagger.responses[201] = {description: 'Team successfully created', schema: {message: 'Team Successful Created.', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 201, "Team successfully created.", {
      role: updatedHacker.role,
      registered_at: updatedHacker.registered_at,
      hackathon: updatedHacker.hackathon,
      team: updatedHacker.team,
    });
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const join = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = "Endpoint for joining an existing a team"
  // #swagger.security = [{"apiKeyAuth": []}]
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Team Invite Code", schema: {inviteCode: "AE56B3"}}
    const { inviteCode } = req.body;
    const hackathonId = req.params?.id;
    const user = req.user;

    // Validate user data
    if (!inviteCode)
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'User data is required.', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "User data is required.");

    // Check if event exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonId },
    });
    if (!hackathon) return errorResponse(res, 404, "Hackathon not found");

    // Check if user is in another team.
    const hacker = await prisma.hacker.findFirst({
      where: {
        user: { email: user.email },
        hackathon: { unique_name: hackathonId },
      },
    });
    if (!hacker)
      return errorResponse(
        res,
        404,
        "User is not registered for this hackathon"
      );
    if (hacker.team_id)
      return errorResponse(res, 400, "Hacker is already registered for a Team");

    // Check that team exists
    const team = await prisma.team.findUnique({
      where: { invite_code: inviteCode.toUpperCase() },
    });
    if (!team)
      return errorResponse(
        res,
        400,
        `Team with invite code ${inviteCode} does note exist`
      );

    // Add hacker to team
    const updatedHacker = await prisma.hacker.update({
      where: { id: hacker.id },
      data: { team_id: team.id },
      include: {
        hackathon: {
          select: {
            name: true,
            description: true,
            unique_name: true,
            start_date: true,
            registration_deadline: true,
          },
        },
        team: true,
      },
    });

    // #swagger.responses[200] = {description: 'You have successfully been added to the team', schema: {message: 'You have successfully been added to the team.', data: {details: "If more info is available it will be here."}}}
    return successResponse(
      res,
      200,
      "You have successfully been added to the team.",
      {
        role: updatedHacker.role,
        registered_at: updatedHacker.registered_at,
        hackathon: updatedHacker.hackathon,
        team: updatedHacker.team,
      }
    );
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getTeam = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = "Endpoint for getting the details of the team the user is in"
  // #swagger.security = [{"apiKeyAuth": []}]
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon", required: 'true'}
    const hackathonId = req.params?.id;
    const user = req.user;

    // Get hacker
    const hacker = await prisma.hacker.findFirst({
      where: {
        hackathon: { unique_name: hackathonId },
        user: { email: user.email },
      },
    });
    if (!hacker)
      return errorResponse(
        res,
        400,
        "User has not registered for this Hackathon"
      );

    if (!hacker.team_id) return errorResponse(res, 400, "Hacker has no team");
    const team = await prisma.team.findUnique({
      where: { id: hacker.team_id },
      include: {
        hackers: {
          select: {
            role: true,
            hackathon: true,
            user: {
              select: {
                sub_community: true,
                tech_skills: true,
                phone_number: true,
                gender: true,
                profile_pic: true,
                uid: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // #swagger.responses[200] = {description: 'Successfully Gotten', schema: {message: 'Successful.', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "Successfully.", team);
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const leaveTeam = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = "Endpoint for leaving a team"
  // #swagger.security = [{"apiKeyAuth": []}]
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon", required: 'true'}
    const hackathonId = req.params?.id;
    const user = req.user;

    // Get and update hacker
    const hacker = await prisma.hacker.findFirst({
      where: {
        hackathon: { unique_name: hackathonId },
        user: { email: user.email },
      },
    });
    if (!hacker)
      return errorResponse(
        res,
        400,
        "User has not registered for this Hackathon"
      );

    await prisma.hacker.update({
      where: { id: hacker.id },
      data: {
        team_id: null,
      },
      include: {
        hackathon: true,
        user: {
          select: {
            sub_community: true,
            tech_skills: true,
            phone_number: true,
            gender: true,
            profile_pic: true,
            uid: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    // #swagger.responses[204] = {description: 'Successful', schema: {message: 'Successful.', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 204, "Successful.");
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const teams = { create, join, getTeam, leaveTeam };
export default teams;
