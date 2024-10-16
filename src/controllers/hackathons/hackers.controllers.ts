import prisma from "../../../prisma/client";
import { errorResponse, successResponse } from "../../utils/responseHandlers";
import { isValidEmailAddress } from "../../utils/validationHandlers";
import { Request, Response } from "express";
import bycrypt from "bcrypt";
import { sendMail } from "../../utils/mailHandler";
import { createAuthTokens } from "../../utils/tokenHandlers";

const create = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = "Endpoint for creating a hacker"
  try {
    // #swagger.parameters['id'] = {in: "path" ,description: "Id of the hackathon User is regiatering for", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Hackers details", schema: {email: "jondoe@example.com", role: "frontend developer", password: "strong password"}}
    const { email, role, password } = req.body;
    const hackathonId = req.params?.id;

    // Validate user data
    if (!email || !isValidEmailAddress(email))
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "Invalid email address");

    // Checl if event exists
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonId },
    });
    if (!hackathon) return errorResponse(res, 404, "Hackathon not found");

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!existingUser) return errorResponse(res, 404, "User not found");

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

        // Create Hacker in DB
        prisma.hacker
          .create({
            data: {
              user_id: existingUser.id,
              hackathon_id: hackathon.id,
              role: role,
              passwordHash: hashedPassword,
            },
            include: { hackathon: true, user: true, team: true },
          })
          .then((newHacker) => {
            if (!newHacker) {
              // #swagger.responses[500] = {description: 'Account was not created. Something went wrong', schema: {error: 'Account was not created. Something went wrong', details: "If more info is available it will be here."}}
              return errorResponse(
                res,
                500,
                "Account was not created. Something went wrong"
              );
            }

            // Send mail
            sendMail(
              email,
              `${newHacker.user.first_name} You’re Ready for the Hackathon!`,
              "hackathon_registeration",
              { firstName: newHacker.user.first_name }
            );

            // #swagger.responses[201] = {description: 'Hacker account successfully created', schema: {message: 'Successful Registration.', data: {details: "If more info is available it will be here."}}}
            return successResponse(res, 201, "Successful Registration.", {
              role: newHacker.role,
              team: newHacker.team,
              registerationDate: newHacker.registered_at,
              user: {
                uid: newHacker.user.uid,
                fistName: newHacker.user.first_name,
                lastName: newHacker.user.last_name,
                email: newHacker.user.email,
              },
              hackathon: newHacker.hackathon,
            });
          })
          .catch((err) =>
            errorResponse(res, 500, "could not create hacker", { details: err })
          );
      });
    });
  } catch (error) {
    console.log("error ==>>", error);

    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const login = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for signing into a hacker account'

  try {
    /*  #swagger.parameters['body'] = {
              in: 'body',
              description: 'Log In',
              schema: { email: "jonDoe@example.com", password: "P@ssword123" }
      } */
    //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
    const { email, password } = req.body;
    const hackathonUid = req.params?.id;

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

    // Get hackathon
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonUid },
    });
    if (!hackathon)
      return errorResponse(res, 404, "Path does not exist.", {
        details: "Wrong hackathon unique Id/name.",
      });

    // Get User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return errorResponse(res, 400, "Hacker with email does not exist.");

    // Check that hacker exists
    const existingHacker = await prisma.hacker.findUnique({
      where: { hackathon_id: hackathon.id, user_id: user?.id },
    });
    if (!existingHacker) {
      return errorResponse(res, 400, "Hacker with email does not exists");
    }

    // Confirm password
    bycrypt.compare(
      password,
      existingHacker.passwordHash || "",
      (err, result) => {
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
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: "hacker",
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
                    role: "hacker"},
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
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            uid: user.uid,
            role: existingHacker.role,
            registeredOn: existingHacker.registered_at,
          },
        });
      }
    );
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error", error);
  }
};

const getHacker = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for getting a hacker account'

  try {
    //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
    //  #swagger.parameters["email"] = {in: "path", description: "Hackers email"}
    const hackathonUid = req.params?.id;
    const email = req.params?.email;
    console.table({ hackathonUid, email });

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

    // Get hackathon
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonUid },
    });
    if (!hackathon)
      return errorResponse(res, 404, "Path does not exist.", {
        details: "Wrong hackathon unique Id/name.",
      });

    // Get User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return errorResponse(res, 400, "Hacker with email does not exist.");

    // Check that hacker exists
    const existingHacker = await prisma.hacker.findUnique({
      where: { hackathon_id: hackathon.id, user_id: user?.id },
    });
    if (!existingHacker) {
      return errorResponse(res, 400, "Hacker with email does not exists");
    }

    /* #swagger.responses[200] = {
        description: 'Successful Request',
        schema: {
            message: 'Request Successfully',
            data: "Any extra details."
  } }
      */
    return successResponse(res, 200, "Request Successfully", {
      hackerDetails: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        uid: user.uid,
        role: existingHacker.role,
        registeredOn: existingHacker.registered_at,
      },
    });
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error", error);
  }
};

const getLoggedInHacker = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for getting a hacker account of a logged in user'

  try {
    //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
    const hackathonUid = req.params?.id;
    const email = req.user?.email;
    console.table({ hackathonUid, email });

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

    // Get hackathon
    const hackathon = await prisma.hackathon.findUnique({
      where: { unique_name: hackathonUid },
    });
    if (!hackathon)
      return errorResponse(res, 404, "Path does not exist.", {
        details: "Wrong hackathon unique Id/name.",
      });

    // Get User
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return errorResponse(res, 400, "Hacker with email does not exist.");

    // Check that hacker exists
    const existingHacker = await prisma.hacker.findUnique({
      where: { hackathon_id: hackathon.id, user_id: user?.id },
    });
    if (!existingHacker) {
      return errorResponse(res, 400, "Hacker with email does not exists");
    }

    /* #swagger.responses[200] = {
        description: 'Successful Request',
        schema: {
            message: 'Request Successfully',
            data: "Any extra details."
  } }
      */
    return successResponse(res, 200, "Request Successfully", {
      hackerDetails: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        uid: user.uid,
        role: existingHacker.role,
        registeredOn: existingHacker.registered_at,
      },
    });
  } catch (error) {
    // Handle error
    return errorResponse(res, 500, "Internal Error", error);
  }
};

const hackers = { create, login, getHacker, getLoggedInHacker };
export default hackers;
