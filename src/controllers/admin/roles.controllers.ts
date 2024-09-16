import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import prisma from "../../../prisma/client";
import { isValidRole } from "../../utils/validationHandlers";

const assignRoles = async (req: Request, res: Response) => {
  // #swagger.tags = ['Admin Management']
  // #swagger.summary = 'Endpoint for assigning roles to other accounts.'
  // #swagger.security = [{"apiKeyAuth": []}]

  try {
    /*  #swagger.parameters['body'] = {
            in: 'body',
            schema: { uid: "1234-4324-3233-342232", role: "admin"}
    } */
    const { uid, role } = req.body;
    console.table({ uid, role });

    // Validations
    // if (role === "superadmin")
    //   // #swagger.responses[400] = {description: 'Bad Request', schema: {error: 'Invalid role: Acceptable roles are admin, event_admin, judge, writer.', data: {details: "If more info is available it will be here."}}}
    //   return errorResponse(res, 400, "Role of superadmin can not be assigned");
    // if (role === "admin" && req.user.role !== "superadmin")
    //   // #swagger.responses[401] = {description: 'Unauthorized', schema: {error: 'Only superadmins can assign admin roles.', data: {details: "If more info is available it will be here."}}}
    //   return errorResponse(res, 401, "Only superadmins can assign admin roles");

    console.log("Passed Validations");

    // Get or create role
    let userRole = await prisma.role.findUnique({
      where: { role: role as string },
    });
    if (!userRole) {
      if (isValidRole(role)) {
        userRole = await prisma.role.create({ data: { role: role } });
      } else {
        return errorResponse(
          res,
          400,
          "Invalid role: Acceptable roles are admin, event_admin, judge, writer."
        );
      }
    }

    console.log("Has User roles. Passed this stage");

    // Update user account
    const user = await prisma.user.update({
      where: { uid },
      data: { roleId: userRole.id },
      include: { roles: true },
    });

    console.log("User got");
    console.table(user);
    // #swagger.responses[200] = {description: 'Successful Request', schema: {message: 'User roles successfully updated', data: {firstName: "Jon",lastName: "doe",email: "doe@mail.com",uid: "1123-3223-3433-34322",role: "admin"}}}
    return successResponse(res, 200, "User roles successfully updated", {
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      uid: user.uid,
      role: user?.roles?.role,
    });
  } catch (error) {
    console.log("error => ", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal Server Error', schema: {error: 'Internal Server Error', details: "If more info is available it will be here."}}
    // return errorResponse(res, 500, "Internal Error", error);
  }
};

const roles = { assignRoles };
export default roles;
