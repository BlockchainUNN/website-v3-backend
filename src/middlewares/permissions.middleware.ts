import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/responseHandlers";
import { ROLES } from "../types/auth.types";
import prisma from "../../prisma/client";

/**
 * @description This middleware checks the request user for the users role
 * @required Authenticated User
 */
const permissionsCheck =
  ({ role, allowOwner }: { role: ROLES; allowOwner: boolean }) =>
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return errorResponse(res, 401, "User is unauthenticated.");

    try {
      // If owner is allowed.
      let owner;
      if (allowOwner && req.params.id)
        owner = await prisma.user.findUnique({ where: { uid: req.params.id } });

      // If superadmin
      if (
        (role === "superadmin" && req.user.role === "superadmin") ||
        owner?.email === req.user.email
      )
        next();

      // If admin
      if (
        (role === "admin" &&
          (req.user.role === "superadmin" || req.user.role === "admin")) ||
        owner?.email === req.user.email
      )
        next();

      // If event_admin
      if (
        (role === "event_admin" &&
          (req.user.role === "superadmin" ||
            req.user.role === "admin" ||
            req.user.role === "event_admin")) ||
        owner?.email === req.user.email
      )
        next();

      // If judge
      if (
        (role === "judge" &&
          (req.user.role === "superadmin" ||
            req.user.role === "admin" ||
            req.user.role === "judge")) ||
        owner?.email === req.user.email
      )
        next();

      // If writer
      if (
        (role === "writer" &&
          (req.user.role === "superadmin" ||
            req.user.role === "admin" ||
            req.user.role === "writer")) ||
        owner?.email === req.user.email
      )
        next();

      return errorResponse(
        res,
        401,
        "You are not authorized to use this service."
      );
    } catch (error) {
      return errorResponse(
        res,
        401,
        "You are not authorized to use this service.",
        error
      );
    }
  };

const PermissionsMiddleware = { permissionsCheck };
export default PermissionsMiddleware;
