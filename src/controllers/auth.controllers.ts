import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandlers";

const register = async (req: Request, res: Response) => {
  // #swagger.tags = ['Authentication']
  try {
    // Handle logic
    return successResponse(res, 200, "Successful Registration");
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error");
  }
};

const login = async (req: Request, res: Response) => {
  // #swagger.tags = ['Authentication']
  try {
    // Handle logic
    return successResponse(res, 200, "Successful Registration");
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error");
  }
};

const auth = { register, login };
export default auth;
