import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import { isValidEmailAddress } from "../../utils/validationHandlers";
import { Request, Response } from "express";
import bycrypt from "bcrypt";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = "Endpoint for creating a hacker"
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is regiatering for", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Hackers details", schema: {email: "jondoe@example.com", role: "frontend developer", password: "strong password"}}
    const { email, role, password } = req.body;
    const hackathonId = req.params?.id;

    // Validate user data
    if (!email || !isValidEmailAddress(email))
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "Invalid email address");

    // Checl if event exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonId },
    });
    if (!hackathon) return errorResponse(res, 404, "Hackathon not found");

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!existingUser) return errorResponse(res, 404, "User not found");

    // Handle password hashing
    bycrypt.genSalt(10, (err, salt) => {
      if (err)
        /* #swagger.responses[500] = {
                description: 'Something went wrong server side',
                schema: {
                    error: 'Internal Server Error',
                    data: {details: "If more info is available it will be here."}
                }
             }
            */
        return errorResponse(res, 500, "Internal Server Error", {
          details: "Error generating password salt",
        });

      bycrypt.hash(password, salt, (err, hashedPassword) => {
        if (err)
          return errorResponse(res, 500, "Internal Server Error", {
            details: "Error hashing password",
          });

        // Create Hacker in DB
        prisma.hacker
          .create({
            data: {
              user_id: existingUser.id,
              hackathon_id: hackathon.id,
              role: role,
              passwordHash: hashedPassword,
            },
            include: { hackathon: true, user: true, team: true },
          })
          .then((newHacker) => {
            if (!newHacker) {
              // #swagger.responses[500] = {description: 'Account was not created. Something went wrong', schema: {error: 'Account was not created. Something went wrong', details: "If more info is available it will be here."}}
              return errorResponse(
                res,
                500,
                "Account was not created. Something went wrong"
              );
            }

            // #swagger.responses[201] = {description: 'Hacker account successfully created', schema: {message: 'Successful Registration.', data: {details: "If more info is available it will be here."}}}
            return successResponse(res, 201, "Successful Registration.", {
              role: newHacker.role,
              team: newHacker.team,
              registerationDate: newHacker.registered_at,
              user: {
                uid: newHacker.user.uid,
                fistName: newHacker.user.first_name,
                lastName: newHacker.user.last_name,
                email: newHacker.user.email,
              },
              hackathon: newHacker.hackathon,
            });
          })
          .catch((err) =>
            errorResponse(res, 500, "could not create hacker", { details: err })
          );
      });
    });
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const hackers = { create };
export default hackers;
