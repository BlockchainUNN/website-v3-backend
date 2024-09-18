// In permissions.middleware.ts
import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responseHandlers";
import { ROLES } from "../types/auth.types";
import prisma from "../../prisma/client";

/**
 * @description This middleware checks the request user for the user's role
 * @required Authenticated User
 */
export const permissionsCheck = ({
  role,
  allowOwner = false,
}: {
  role?: ROLES;
  allowOwner?: boolean;
}) => {
  // Process the roles array
  const roles: ROLES[] =
    role === "superadmin"
      ? ["superadmin"]
      : role === "admin"
      ? ["admin", "superadmin"]
      : role
      ? [role, "admin", "superadmin"]
      : ["admin", "superadmin"];

  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, 401, "User is unauthenticated.");

    try {
      // If owner is allowed
      let owner;
      if (allowOwner && req.params.id) {
        owner = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
        if (!owner) {
          console.log(`No owner found for id: ${req.params.id}`);
        }
      }

      if (
        roles.includes(req.user.role as ROLES) ||
        (allowOwner && owner?.email === req.user.email)
      ) {
        console.log(`User authorized with role: ${req.user.role}`);
        return next();
      } else {
        console.log("Authorization failed. Insufficient permissions.");
        return errorResponse(
          res,
          401,
          "You are not authorized to use this service."
        );
      }
    } catch (error) {
      return errorResponse(
        res,
        401,
        "You are not authorized to use this service.",
        error
      );
    }
  };
};
