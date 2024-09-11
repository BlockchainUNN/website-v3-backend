import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responseHandlers";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env?.SECRET_KEY || "random_string";

/**
 * @description This middleware checks the user token supplied as Bearer authorization
 * @required Bearer Authorization
 *
 * PROPOSED FLOW
 * - User registers or logs in and gets 2 tokens (access, refresh)
 * - Access token short lived (bout 24hrs)
 * - Refresh lasts longer (bout a week)
 * - A blacklist for refresh tokens refresh tokens are swapped out everytime they are used.
 * - This function checks specifically the access token tho.
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
      // Check that the token is still valid
      jwt.verify(token, SECRET_KEY, function (err, decoded) {
        if (err) {
          throw err;
        }
        console.log("Decoded Token ===>> ", decoded); // Verify that after expiration the token becomes invalid and throws error.
        // Add user object to the request object.
        next();
      });
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
