import prisma from "../../../prisma/client";
import {
  cvsResponse,
  errorResponse,
  successResponse,
} from "../../utils/responseHandlers";
import { Request, Response } from "express";

const downloadHackers = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for downloading hacker's details'

  try {
    // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get hackers
    const hackers = await prisma.hacker.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      select: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            tech_skills: true,
            phone_number: true,
            gender: true,
          },
        },
        role: true,
        registered_at: true,
        team: { select: { name: true, created_at: true } },
      },
    });

    const data = hackers.map((detail) => {
      return {
        firstName: detail.user.first_name,
        lastName: detail.user.last_name,
        email: detail.user.email,
        phoneNumber: detail.user.phone_number,
        gender: detail.user.gender,
        techSkill: detail.user.tech_skills,
        registeredAt: detail.registered_at,
        role: detail.role,
        team: detail.team?.name,
        teamCreatedAt: detail.team?.created_at,
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return cvsResponse(res, 200, "hackersDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getHackers = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for viewing hacker's details'

  try {
    // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get hackers
    const hackers = await prisma.hacker.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      select: {
        id: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            tech_skills: true,
            phone_number: true,
            gender: true,
          },
        },
        role: true,
        registered_at: true,
        team: { select: { name: true, created_at: true } },
      },
    });

    const data = hackers.map((detail) => {
      return {
        id: detail.id,
        firstName: detail.user.first_name,
        lastName: detail.user.last_name,
        email: detail.user.email,
        phoneNumber: detail.user.phone_number,
        gender: detail.user.gender,
        techSkill: detail.user.tech_skills,
        registeredAt: detail.registered_at,
        role: detail.role,
        team: detail.team?.name,
        teamCreatedAt: detail.team?.created_at,
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "hackersDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

// const editHacker = async (req: Request, res: Response) => {
//   // #swagger.tags = ['Hackers']
//   // #swagger.summary = 'Endpoint for editing hacker's details'

//   try {
//     // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
//     const hackathonId = req.params?.id;
//     const hackerId = Number(req.params?.hackerId);

//     // Get hackers
//     const hackers = await prisma.hacker.findUnique({
//       where: { id: hackerId },
//       select: {
//         user: {
//           select: {
//             first_name: true,
//             last_name: true,
//             email: true,
//             tech_skills: true,
//             phone_number: true,
//             gender: true,
//           },
//         },
//         role: true,
//         registered_at: true,
//         team: { select: { name: true, created_at: true } },
//       },
//     });

//     const data = hackers.map((detail) => {
//       return {
//         firstName: detail.user.first_name,
//         lastName: detail.user.last_name,
//         email: detail.user.email,
//         phoneNumber: detail.user.phone_number,
//         gender: detail.user.gender,
//         techSkill: detail.user.tech_skills,
//         registeredAt: detail.registered_at,
//         role: detail.role,
//         team: detail.team?.name,
//         teamCreatedAt: detail.team?.created_at,
//       };
//     });

//     // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
//     return cvsResponse(res, 200, "hackersDetails", data);
//   } catch (error) {
//     // Handle error
//     console.log(error);

//     // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
//     return errorResponse(res, 500, "Internal Error", { details: error });
//   }
// };

const hackers = {
  downloadHackers,
  getHackers,
  //   editHacker,
};
export default hackers;
