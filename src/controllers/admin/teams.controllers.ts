import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import {
  cvsResponse,
  errorResponse,
  successResponse,
} from "../../utils/responseHandlers";

const downloadTeamsData = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = 'Endpoint for downloading Teams details'

  try {
    // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get teams
    const teams = await prisma.team.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      select: {
        id: true,
        name: true,
        created_at: true,
        submission: {
          select: {
            project_name: true,
            category: true,
          },
        },
      },
    });

    const data = teams.map((detail) => {
      return {
        id: detail.id,
        name: detail.name,
        projectSubmitted: detail.submission?.[0]?.project_name ? true : false,
        project: detail.submission?.[0]?.project_name,
        category: detail.submission?.[0]?.category,
        dateFormed: detail.created_at,
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return cvsResponse(res, 200, "teamDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getTeamsData = async (req: Request, res: Response) => {
  // #swagger.tags = ['Teams']
  // #swagger.summary = 'Endpoint for getting Teams details'

  try {
    // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get teams
    const teams = await prisma.team.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      select: {
        id: true,
        name: true,
        created_at: true,
        submission: {
          select: {
            project_name: true,
            category: true,
          },
        },
      },
    });

    const data = teams.map((detail) => {
      return {
        id: detail.id,
        name: detail.name,
        projectSubmitted: detail.submission?.[0]?.project_name ? true : false,
        project: detail.submission?.[0]?.project_name,
        category: detail.submission?.[0]?.category,
        dateFormed: detail.created_at,
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "teamDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const teams = { downloadTeamsData, getTeamsData };
export default teams;
