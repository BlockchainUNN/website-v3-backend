import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandlers";
import { isValidEmailAddress } from "../utils/validationHandlers";
import prisma from "../../prisma/client";
import bycrypt from "bcrypt";
import { createAuthTokens } from "../utils/tokenHandlers";

const login = async (req: Request, res: Response) => {
  // #swagger.tags = ['Authentication']
  // #swagger.summary = 'Endpoint for signing into an account'

  try {
    /*  #swagger.parameters['body'] = {
              in: 'body',
              description: 'Log In - Password is only required for users with roles',
              schema: { email: "jonDoe@example.com", password: "P@ssword123" }
      } */
    const { email, password } = req.body;

    // Data Validations
    if (!email || !isValidEmailAddress(email))
      /* #swagger.responses[400] = {
              description: 'Bad request - Missing or invalid credentials',
              schema: {
                  error: 'You need to provide a valid email address',
                  data: {details: "If more info is available it will be here."}
              }
          } 
       */
      return errorResponse(
        res,
        400,
        "You need to provide a valid email address"
      );

    // Check that user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
      include: { roles: true },
    });
    if (!existingUser) {
      return errorResponse(res, 400, "User with email does not exists");
    }

    // Check if the user has a role and password
    if (!existingUser.roleId)
      // If no role then also no password
      /* #swagger.responses[200] = {
      description: 'Users with no role have no password hence no token',
      schema: {
          message: 'Request successful',
          data: {
              userDetails: {
                  firstName: "Jon",
                  lastName: "Doe",
                  email: "jonDoe@example.com",
                  uid: "uid here...",
                  role: null},
              }
          }
        } 
      }
      */
      return successResponse(res, 200, "Request successful", {
        userDetails: {
          firstName: existingUser.first_name,
          lastName: existingUser.last_name,
          email: existingUser.email,
          uid: existingUser.uid,
          role: null,
        },
      });

    if (!existingUser.hashed_password)
      /* #swagger.responses[409] = {
      description: 'Users with roles but no password need to add a password',
      schema: {
          error: 'Action Required: Verify email address and update password'
        } 
      }
      */
      return errorResponse(
        res,
        409,
        "Action Required: Verify email address and update password"
      );

    if (!password)
      return errorResponse(res, 400, "You need to provide a password");

    // Confirm password
    bycrypt.compare(password, existingUser.hashed_password, (err, result) => {
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
          details: "Error comparing passwords",
        });

      if (!result)
        /* #swagger.responses[404] = {
              description: 'Unauthorized',
              schema: {
                  error: 'Wrong Password',
              }
           }
          */
        return errorResponse(res, 404, "Wrong Password");

      const { access, refresh } = createAuthTokens({
        firstName: existingUser.first_name,
        lastName: existingUser.last_name,
        email: existingUser.email,
        role: existingUser.roles?.role,
      });
      /* #swagger.responses[200] = {
        description: 'Successful Request',
        schema: {
            message: 'Request Successfully',
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
                    role: "writer"},
                }
            }
        }
      } 
      */
      return successResponse(res, 200, "Request Successfully", {
        tokens: {
          access,
          refresh,
        },
        userDetails: {
          firstName: existingUser.first_name,
          lastName: existingUser.last_name,
          email: existingUser.email,
          uid: existingUser.uid,
          role: existingUser.roles?.role,
        },
      });
    });
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error", error);
  }
};

const auth = { login };
export default auth;
