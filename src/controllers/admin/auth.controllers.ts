import { Request, Response } from "express";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import prisma from "../../../prisma/client";
import {
  isStrongPassword,
  isValidEmailAddress,
  isValidRole,
} from "../../utils/validationHandlers";
import bycrypt from "bcrypt";
import { createAuthTokens } from "../../utils/tokenHandlers";

const register = async (req: Request, res: Response) => {
  // #swagger.tags = ['Admin Management']
  // #swagger.summary = 'Endpoint for creating a superadmin account'

  try {
    /*  #swagger.parameters['body'] = {
            in: 'body',
            description: 'Create a superuser',
            schema: { firstName: "Jon", lastName: "Doe", email: "jonDoe@example.com", password: "P@ssword123" }
    } */
    const { firstName, lastName, email, password } = req.body;
    const role = "superadmin";
    const max_count = Number(process.env.MAX_SUPER_ADMINS) || 3; // Maximum number of super admins

    // Get or create role
    let userRole = await prisma.role.findUnique({
      where: { role: role as string },
    });
    if (!userRole && isValidRole(role)) {
      userRole = await prisma.role.create({ data: { role: role } });
    }

    // Check that super admins can still be created - can be commented out if deemed unnecessary
    const superadminCount = await prisma.user.count({
      where: {
        roles: { role: role },
      },
    });
    if (superadminCount >= max_count) {
      /* #swagger.responses[403] = {
            description: 'Thrown when the maximum amount of superadmins already exist in the database',
            schema: {
                error: 'Superadmin slots filled',
            }
        } 
    */
      return errorResponse(res, 403, "Superadmin slots filled");
    }

    // Data Validations
    if (!firstName || !lastName)
      /* #swagger.responses[400] = {
            description: 'Bad request - Missing or invalid credentials',
            schema: {
                error: 'invalid email address',
                data: {details: "If more info is available it will be here."}
            }
        } 
     */
      return errorResponse(
        res,
        400,
        "You need to provide a first and last name"
      );
    if (!isValidEmailAddress(email))
      return errorResponse(res, 400, "Invalid email address");
    if (!isStrongPassword(password))
      return errorResponse(res, 400, "Password is too weak", {
        details:
          "A strong password must be up to 8 characters long and must contain atleast 1 uppercase letter, 1 number, and atleast 1 special character",
      });

    // Check that email is unused
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      return errorResponse(res, 400, "User with email already exists");
    }

    // Handle password hashing
    bycrypt.genSalt(10, (err, salt) => {
      if (err)
        /* #swagger.responses[500] = {
            description: 'Something went wrong server side',
            schema: {
                error: 'Internal Server Error',
                data: {details: "If more info is available it will be here."}
            }
         }
        */
        return errorResponse(res, 500, "Internal Server Error", {
          details: "Error generating password salt",
        });

      bycrypt.hash(password, salt, (err, hashedPassword) => {
        if (err)
          return errorResponse(res, 500, "Internal Server Error", {
            details: "Error hashing password",
          });

        // Create User in DB
        prisma.user
          .create({
            data: {
              first_name: firstName,
              last_name: lastName,
              hashed_password: hashedPassword,
              email: email,
              [userRole ? "roleId" : (null as any)]: userRole
                ? userRole.id
                : null,
            },
          })
          .then((newUser) => {
            // Create access and refresh token for user
            const { access, refresh } = createAuthTokens({
              firstName: newUser.first_name,
              lastName: newUser.last_name,
              email: newUser.email,
              role: userRole?.role,
            });

            /* #swagger.responses[201] = {
            description: 'Successfully created',
            schema: {
                message: 'SuperAdmin Created Successfully',
                data: {
                    tokens: {
                        access: "access token...",
                        refresh: "refresh token...",
                    },
                    userDetails: {
                        firstName: "Jon",
                        lastName: "Doe",
                        email: "jonDoe@example.com",
                        uid: "uid here...",
                        role: "superadmin"},
                    }
                }
            } 
            */
            return successResponse(
              res,
              201,
              "SuperAdmin Created Successfully",
              {
                tokens: {
                  access,
                  refresh,
                },
                userDetails: {
                  firstName: newUser.first_name,
                  lastName: newUser.last_name,
                  email: newUser.email,
                  uid: newUser.uid,
                  role: userRole?.role,
                },
              }
            );
          })
          .catch((err) =>
            errorResponse(res, 500, "could not create user", { details: err })
          );
      });
    });
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error");
  }
};

const auth = { register };
export default auth;
