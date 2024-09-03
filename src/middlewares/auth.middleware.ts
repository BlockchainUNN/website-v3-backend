import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responseHandlers";

/**
 * @description This middleware checks the user token supplied as Bearer authorization
 * @required Bearer Authorization
 */
const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let receivedToken = req.headers.authorization;
  let token;

  if (receivedToken && receivedToken.startsWith("Bearer")) {
    try {
      token = receivedToken.split(" ")[1]; // JWT
      // TODO: Handle Token verification logic using jsonwebtoken package
    } catch (error) {
      return errorResponse(
        res,
        401,
        "You are not authorized to use this service.",
        error
      );
    }
  }
  if (!token) {
    return errorResponse(
      res,
      401,
      "You are not authorized to use this service, no token provided."
    );
  }
  next();
};

const AuthMiddleware = { protectRoute };
export default AuthMiddleware;
