import { Request, Response } from "express";
import {
  cvsResponse,
  errorResponse,
  successResponse,
} from "../../utils/responseHandlers";
import prisma from "../../../prisma/client";

const downloadSubmissions = async (req: Request, res: Response) => {
  // #swagger.tags = ['Submissions']
  // #swagger.summary = "Endpoint for downloading User submissions"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get the event
    const submissions = await prisma.submission.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      include: { team: true, images: true },
    });
    if (!submissions) return errorResponse(res, 404, "Hackathon not found");

    const data = submissions.map((detail) => {
      return {
        id: detail.id,
        team: detail.team.name,
        project_name: detail.project_name,
        category: detail.category,
        project_description: detail.project_description,
        github_links: detail.github_links,
        demo_video_link: detail.demo_video_link,
        live_demo_link: detail.live_demo_link,
        documentation_link: detail.documentation_link,
        Images: detail.images.map((img) => img.image_url).join(","),
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return cvsResponse(res, 200, "hackerSubmissions", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getSubmissions = async (req: Request, res: Response) => {
  // #swagger.tags = ['Submissions']
  // #swagger.summary = "Endpoint for getting User submissions"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get the event
    const submissions = await prisma.submission.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      include: { team: true, images: true },
    });
    if (!submissions) return errorResponse(res, 404, "Hackathon not found");

    const data = submissions.map((detail) => {
      return {
        id: detail.id,
        team: detail.team.name,
        project_name: detail.project_name,
        category: detail.category,
        project_description: detail.project_description,
        github_links: detail.github_links,
        demo_video_link: detail.demo_video_link,
        live_demo_link: detail.live_demo_link,
        documentation_link: detail.documentation_link,
        Images: detail.images.map((img) => img.image_url).join(","),
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "hackerSubmissions", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const submission = { downloadSubmissions, getSubmissions };
export default submission;
