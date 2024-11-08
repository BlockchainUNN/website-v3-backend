import { Request, Response } from "express";
import { isValidEmailAddress } from "../../utils/validationHandlers";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import prisma from "../../../prisma/client";
import { sendMail } from "../../utils/mailHandler";

const register = async (req: Request, res: Response) => {
  // #swagger.tags = ['Bootcamp']
  // #swagger.summary = "Endpoint for registering for an the bootcamp"
  try {
    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      track,
      levelOfExperience,
      goals,
      gender,
      student,
      location,
      availability,
    } = req.body;

    // Validate user data
    if (!email || !isValidEmailAddress(email))
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "Invalid email address");
    // Validate user data
    if (!firstName || !lastName)
      return errorResponse(res, 400, "Please fill in your name.");
    if (!phoneNumber)
      return errorResponse(res, 400, "Please fill in your Phone number.");
    if (!track) return errorResponse(res, 400, "Please select a track.");
    if (!levelOfExperience)
      return errorResponse(res, 400, "Please select a level of experience.");

    if (await prisma.bootcampApplication.findUnique({ where: { email } }))
      return errorResponse(
        res,
        400,
        "User with this email already registered for the bootcamp."
      );

    const bootcampReg = await prisma.bootcampApplication.create({
      data: {
        FirstName: firstName,
        lastName,
        phoneNumber,
        email,
        track,
        levelOfExperience,
        gender,
        student,
        goals,
        location,
        availability,
      },
    });

    // Send mail
    const bootcampMail = bootcampReg.track.toLowerCase().includes("content")
      ? "content_bootcamp_registeration"
      : bootcampReg.track.toLowerCase().includes("2")
      ? "web2_bootcamp_registeration"
      : "web3_bootcamp_registeration";
    const response = await sendMail(
      email,
      `BlockchainUNN Bootcamp Registeration`,
      bootcampMail,
      { firstName: bootcampReg.FirstName }
    );
    if (response.rejected.includes(email))
      // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
      return errorResponse(
        res,
        403,
        "Failed to deliver the email to the recipient. Please check the email address."
      );

    if (response.accepted.includes(email))
      // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
      return successResponse(
        res,
        201,
        "Successful Registration. Confirmation mail has been sent to email address"
      );
  } catch (error) {
    console.log(error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

export default { register };
