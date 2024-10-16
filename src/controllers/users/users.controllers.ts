import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import {
  isValidEmailAddress,
  isValidPhoneNumber,
} from "../../utils/validationHandlers";
import { uploadSingleImage } from "../../utils/imageUploadHandler";
import { FileType } from "../../types/files.types";
import { sendMail } from "../../utils/mailHandler";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = "Endpoint for creating/adding members to the community"
  try {
    /* 
        #swagger.consumes = ['multipart/form-data']  
        #swagger.parameters['email'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['firstName'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['lastName'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['techSkills'] = { in: 'formData', required: 'true', description: 'Comma Seperated list of skills user is intrested in.'} 
        #swagger.parameters['phoneNumber'] = { in: 'formData'} 
        #swagger.parameters['gender'] = { in: 'formData'} 
        #swagger.parameters['profilePic'] = { in: 'formData', type: 'file'} 
    */
    let { email, firstName, lastName, techSkills, phoneNumber, gender } =
      req.body;
    const profilePic: FileType | undefined = req.file;
    let profilePic_db, uploadedImage: { url: string; public_id: string };

    // Validate user data
    if (!firstName || !lastName)
      return errorResponse(res, 400, "First name and Last name are required.");
    if (!email || !isValidEmailAddress(email))
      /* 
          #swagger.responses[400] = {description: 'Bad request - Missing or invalid credentials', schema: {error: 'Invalid email address', data: {details: "If more info is available it will be here."}}} 
       */
      return errorResponse(res, 400, "Invalid email address");

    if (phoneNumber && !isValidPhoneNumber(phoneNumber))
      return errorResponse(res, 400, "Invalid phone number");
    if (gender.toLowerCase() === "male") {
      gender = "male";
    } else if (gender.toLowerCase() === "female") {
      gender = "female";
    } else {
      gender = null;
    }

    // Mapping tech skills to comunities
    const techSkillsArr = String(techSkills).toLowerCase().split(",");
    let subCommunities: string[] = [];
    if (techSkillsArr.includes("programming"))
      subCommunities = [...subCommunities, "developer"];
    if (
      techSkillsArr.includes("designing") ||
      techSkills.includes("product management")
    )
      subCommunities = [...subCommunities, "design"];
    if (
      techSkillsArr.includes("copywriting") ||
      techSkillsArr.includes("marketing") ||
      techSkillsArr.includes("community management") ||
      techSkills.includes("product management")
    )
      subCommunities = [...subCommunities, "content"];

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      // Todo: Update this with the proper email.
      const response = await sendMail(email, "Welcome Back", "onboarding", {});
      if (response.rejected.includes(email))
        // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
        return errorResponse(
          res,
          403,
          "Failed to deliver the email to the recipient. Please check the email address."
        );

      if (response.accepted.includes(email))
        // #swagger.responses[200] = {description: 'Existing User', schema: {message: 'Email address associated with an existing community member. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}}
        return successResponse(
          res,
          200,
          "Email address associated with an existing community member. Community Links have been sent to email address."
        );
    }

    // Handle image upload
    if (profilePic) {
      uploadedImage = await uploadSingleImage(profilePic);
      profilePic_db = await prisma.image.create({
        data: {
          name: `${firstName} ${lastName} Profile Picture`,
          image_url: uploadedImage.url,
          public_id: uploadedImage.public_id,
        },
      });
    }

    // Add user to database
    const newUser = await prisma.user.create({
      data: {
        email: email,
        first_name: firstName,
        last_name: lastName,
        sub_community: subCommunities,
        tech_skills: techSkillsArr,
        phone_number: phoneNumber,
        gender: gender,
        profile_pic: profilePic_db?.id,
      },
    });

    // TODO: Un comment this when the mail is ready
    // const response = await sendMail(
    //   email,
    //   "Welcome To BlockchainUNN",
    //   "onboarding",
    //   {}
    // );
    // if (response.rejected.includes(email))
    //   return errorResponse(
    //     res,
    //     403,
    //     "Failed to deliver the email to the recipient. Please check the email address."
    //   );

    // // Return User
    // if (response.accepted.includes(email))
    // #swagger.responses[201] = {description: 'New user created', schema: {message: 'Successful Registration. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}}
    return successResponse(
      res,
      201,
      "Successful Registration. Community Links have been sent to email address.",
      {
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        subCommunity: newUser.sub_community,
        techSkills: newUser.tech_skills,
        phoneNumber,
        gender,
        uid: newUser.uid,
        profilePic: profilePic_db?.image_url,
      }
    );
  } catch (error) {
    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getUsers = async (req: Request, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Endpoint for getting list of users'
  // #swagger.security = [{"apiKeyAuth": []}]

  try {
    //to fetch all users
    const users = await prisma.user.findMany();

    // #swagger.responses[200] = {description: 'Get list of users', schema: {message: 'user retrived successfully', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "user retrieved successfully", users);
  } catch (error) {
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
    return errorResponse(
      res,
      500,
      "An error occurred while fetching users",
      error
    );
  }
};

const getUserDetails = async (req: Request, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = 'Get User details'
  // #swagger.parameters['email'] = { in: 'path', required: 'true'}
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // #swagger.responses[404] = {description: 'User not found', schema: {error: 'User not found', data: {details: "If more info is available it will be here."}}}
      return errorResponse(res, 404, "User not found");
    }

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: 'User details retrieved succesfully', data: {details: "If more info is available it will be here."}}}
    return successResponse(
      res,
      200,
      "User details retrieved succesfully",
      user
    );
  } catch (error) {
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}}
    errorResponse(res, 500, "An Error occured fetching user details", error);
  }
};

export default { getUsers, getUserDetails, create };
