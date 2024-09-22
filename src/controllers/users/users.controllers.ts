import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";

const getUsers = async (req: Request, res: Response) => {
  try {
    //to fetch all users
    const users = await prisma.user.findMany();

    return successResponse(res, 200, "user retrieved successfully", users);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "An error occurred while fetching users",
      error
    );
  }
};

const getUserDetails = async (req: Request, res: Response) => {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return errorResponse(res, 404, "User not found");
    }

    return successResponse(
      res,
      200,
      "User details retrieved succesfully",
      user
    );
  } catch (error) {
    errorResponse(res, 500, "An Error occured fetching user details", error);
  }
};

export default { getUsers, getUserDetails };
