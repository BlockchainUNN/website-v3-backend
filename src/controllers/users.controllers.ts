import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandlers";
import { isValidEmailAddress } from "../utils/validationHandlers";
import { uploadSingleImage } from "../utils/imageUploadHandler";
import { FileType } from "../types/files.types";
import prisma from "../../prisma/client";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Users']
  // #swagger.summary = "Endpoint for creating/adding members to the community"
  try {
    /* 
        #swagger.consumes = ['multipart/form-data']  
        #swagger.parameters['email'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['firstName'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['lastName'] = { in: 'formData', required: 'true'} 
        #swagger.parameters['subCommunity'] = { in: 'formData', required: 'true', description: 'Comma Seperated list of subCommunities (developer, design or content) user is intrested in.'} 
        #swagger.parameters['profilePic'] = { in: 'formData', type: 'file'} 
    */
    const { email, firstName, lastName, subCommunity } = req.body;
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

    const subCommunities = String(subCommunity).split(",");
    for (let index = 0; index < subCommunities.length; index++) {
      const item: string = subCommunities[index];
      if (item !== "developer" && item !== "design" && item !== "content")
        return errorResponse(
          res,
          400,
          `${item} is not a valid sub community. Options are developer, design and content `
        );
    }

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      // Todo: resend email with community links and update intrested sub communities
      /* 
          #swagger.responses[200] = {description: 'Existing User', schema: {message: 'Email address associated with an existing community member. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}} 
       */
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
        profile_pic: profilePic_db?.id,
      },
    });

    // Todo: Add email sending after successful registeration.
    // Return User
    /* 
      #swagger.responses[201] = {description: 'New user created', schema: {message: 'Successful Registration. Community Links have been sent to email address.', data: {details: "If more info is available it will be here."}}} 
    */
    return successResponse(
      res,
      201,
      "Successful Registration. Community Links have been sent to email address.",
      {
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        subCommunity: newUser.sub_community,
        uid: newUser.uid,
        profilePic: profilePic_db?.image_url,
      }
    );
  } catch (error) {
    // Handle error
    /* 
      #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', data: {details: "If more info is available it will be here."}}} 
    */
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const users = { create };
export default users;