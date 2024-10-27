import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import { Request, Response } from "express";
import { uploadSingleImage } from "../../utils/imageUploadHandler";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Submissions']
  // #swagger.summary = "Endpoint for submitting Projects"
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is submitting project in", required: 'true'}
    // #swagger.parameters['teamId'] = {in: "path" ,description: "Id of the team User is in", required: 'true'}
    // #swagger.consumes = ['multipart/form-data']
    // #swagger.parameters['name'] = { in: 'formData', required: 'true'}
    // #swagger.parameters['description'] = { in: 'formData', required: 'true'}
    // #swagger.parameters['category'] = { in: 'formData', required: 'true'}
    // #swagger.parameters['liveLink'] = { in: 'formData', required: 'true'}
    // #swagger.parameters['githubLink'] = { in: 'formData',  required: 'true'}
    // #swagger.parameters['demoVideoLink'] = { in: 'formData',  required: 'true'}
    // #swagger.parameters['documentationLink'] = { in: 'formData', required: 'true'}
    // #swagger.parameters['images'] = { in: 'formData', type: 'file'}

    let {
      name,
      description,
      category,
      liveLink,
      githubLink,
      demoVideoLink,
      documentationLink,
    } = req.body;

    const images: Express.Multer.File[] = req.files as Express.Multer.File[];
    const user = req.user;
    const hackathonId = req.params?.id;
    const teamId = Number(req.params?.teamId);

    // Validate user data
    if (
      !name ||
      !description ||
      !category ||
      !liveLink ||
      !githubLink ||
      !demoVideoLink ||
      !documentationLink
    )
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'All fields are required', data: {details: "If more info is available it will be here."}}}
      return errorResponse(res, 400, "All fields are required.");

    // Check that user is in team
    const hacker = await prisma.hacker.findFirst({
      where: {
        user: { email: user.email },
        hackathon: { unique_name: hackathonId },
      },
      include: { team: true, hackathon: true },
    });
    if (!hacker)
      return errorResponse(
        res,
        404,
        "Path not found",
        "Possible causes, wrong hackathon id or user is not a participant in the hackathon."
      );
    if (hacker.team_id !== teamId)
      return errorResponse(
        res,
        400,
        "Hacker is not a member of this team, and can not submit on their behalf"
      );

    // Handle image upload
    const uploadedImages: {
      id: number;
      name: string;
      image_url: string;
      public_id: string;
      description: string | null;
      created_at: Date;
    }[] = [];

    if (images) {
      for (let index = 0; index < images.length; index++) {
        const uploadedImage = await uploadSingleImage(images[index]);
        const uploadedImage_db = await prisma.image.create({
          data: {
            name: `Project '${name}' - image ${index} `,
            image_url: uploadedImage.url,
            public_id: uploadedImage.public_id,
          },
        });
        uploadedImages.push(uploadedImage_db);
      }
    }

    // Delete old submissions
    await prisma.submission.deleteMany({
      where: { hackathon: { unique_name: hackathonId }, team_id: teamId },
    });

    // Add submission to database.
    const newSubmission = await prisma.submission.create({
      data: {
        team_id: teamId,
        hackathon_id: hacker.hackathon.id,
        category: category,
        project_name: name,
        project_description: description,
        github_links: githubLink,
        demo_video_link: demoVideoLink,
        live_demo_link: liveLink,
        documentation_link: documentationLink,
      },
    });

    await prisma.submissionImage.createMany({
      // Format image data for submissionImages.
      data: (() => {
        return uploadedImages.map((image) => {
          return {
            image_url: image.image_url,
            submission_id: newSubmission.id,
          };
        });
      })(),
    });

    // #swagger.responses[201] = {description: 'New Submission created', schema: {message: 'Successful Submission', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 201, "Successful Submission");
  } catch (error) {
    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const get = async (req: Request, res: Response) => {
  // #swagger.tags = ['Submissions']
  // #swagger.summary = "Endpoint for getting submitted Projects"
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is submitting project in", required: 'true'}
    // #swagger.parameters['teamId'] = {in: "path" ,description: "Id of the team User is in", required: 'true'}

    const user = req.user;
    const hackathonId = req.params?.id;
    const teamId = Number(req.params?.teamId);

    // Check that user is in team
    const hacker = await prisma.hacker.findFirst({
      where: {
        user: { email: user.email },
        hackathon: { unique_name: hackathonId },
      },
      include: { team: true, hackathon: true },
    });
    if (!hacker)
      return errorResponse(
        res,
        404,
        "Path not found",
        "Possible causes, wrong hackathon id or user is not a participant in the hackathon."
      );

    if (hacker.team_id !== teamId)
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'Hacker is not a member of this team.', data: {details: "If more info is available it will be here."}}}
      return errorResponse(res, 400, "Hacker is not a member of this team.");

    // GET submission from database.
    const submission = await prisma.submission.findFirst({
      where: { hackathon: { unique_name: hackathonId }, team_id: teamId },
      include: { images: true },
    });

    // #swagger.responses[201] = {description: 'New Submission created', schema: {message: 'Successful Submission', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 201, "Successful", submission);
  } catch (error) {
    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const submissions = { create, get };
export default submissions;
