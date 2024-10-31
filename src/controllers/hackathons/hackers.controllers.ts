import prisma from "../../../prisma/client";
import {
  cvsResponse,
  errorResponse,
  successResponse,
} from "../../utils/responseHandlers";
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

const getHackerCount = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for getting a hacker Count'

  try {
    //  #swagger.parameters["id"] = {in: "path", description: "The Unique id/name of the hackathon"}
    const hackathonUid = req.params?.id;

    // Get hacker Count
    const hackerCount = await prisma.hacker.count({
      where: { hackathon: { unique_name: hackathonUid } },
    });
    if (!hackerCount)
      return errorResponse(res, 404, "Path does not exist.", {
        details: "Wrong hackathon unique Id/name.",
      });

    /* #swagger.responses[200] = {
        description: 'Successful Request',
        schema: {
            message: 'Request Successfully',
            data: "Any extra details."
  } }
      */
    return successResponse(res, 200, "Request Successfully", { hackerCount });
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

const downloadHackers = async (req: Request, res: Response) => {
  // #swagger.tags = ['Hackers']
  // #swagger.summary = 'Endpoint for downloading hacker's details'

  try {
    // #swagger.parameters['id'] = {description: "Id of the hackathon we are checking", required: 'true'}
    const hackathonId = req.params?.id;

    // Get hackers
    const hackers = await prisma.hacker.findMany({
      where: { hackathon: { unique_name: hackathonId } },
      select: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            tech_skills: true,
            phone_number: true,
            gender: true,
          },
        },
        role: true,
        registered_at: true,
        team: { select: { name: true, created_at: true } },
      },
    });

    const data = hackers.map((detail) => {
      return {
        firstName: detail.user.first_name,
        lastName: detail.user.last_name,
        email: detail.user.email,
        phoneNumber: detail.user.phone_number,
        gender: detail.user.gender,
        techSkill: detail.user.tech_skills,
        registeredAt: detail.registered_at,
        role: detail.role,
        team: detail.team?.name,
        teamCreatedAt: detail.team?.created_at,
      };
    });

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return cvsResponse(res, 200, "hackersDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

// const resetHackerPassword = async (req: Request, res: Response) => {
//   // #swagger.tags = ['Hackers']
//   // #swagger.summary = "Endpoint for resetting Hacker passwords"
//   try {
//     // #swagger.parameters['id'] = {description: "Id of the Hackerthon", required: 'true'}
//     // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Takes email, and any other details you send in will be saved as well in a json field", schema: {email: "jondoe@example.com"}}
//     const { email } = req.body;
//     const hackerthonId = req.params?.id;

//     // Validate user data
//     if (!email || !isValidEmailAddress(email))
//       // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
//       return errorResponse(res, 400, "Invalid email address");

//     // Checl if event exists
//     const event = await prisma.event.findUnique({ where: { uid: eventId } });
//     if (!event) return errorResponse(res, 404, "Event not found");

//     // Check if user with email exists
//     const existingUser = await prisma.user.findUnique({
//       where: { email: email },
//       include: { eventAttendee: true },
//     });

//     if (!existingUser) {
//       // #swagger.responses[404] = {description: 'User/Event not found', schema: {message: 'Community member with this email does not exist.', details: "If more info is available it will be here."}}
//       return errorResponse(
//         res,
//         404,
//         "Community member with this email does not exist."
//       );
//     }

//     // Check if user has registered for event already
//     const eventsRegistered = existingUser.eventAttendee.map((eventAttendee) => {
//       return eventAttendee.event_id;
//     });
//     if (eventsRegistered.includes(event.id))
//       return errorResponse(
//         res,
//         400,
//         "You are already registered for this event"
//       );

//     // Register user as an attendee for the event
//     const attendee = await prisma.eventAttendee.create({
//       data: {
//         attendee_id: existingUser.id,
//         event_id: event.id,
//         registrationDetails: req.body,
//       },
//       include: { event: true, user: true },
//     });

//     // Update attendee count in event
//     const updatedEvent = await prisma.event.update({
//       where: { uid: eventId },
//       data: { attendees_count: event.attendees_count + 1 },
//     });

//     // Send mail
//     const response = await sendMail(
//       email,
//       `${attendee.user.first_name} You’re In!`,
//       "event_registration",
//       { firstName: attendee.user.first_name }
//     );
//     if (response.rejected.includes(email))
//       // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
//       return errorResponse(
//         res,
//         403,
//         "Failed to deliver the email to the recipient. Please check the email address."
//       );

//     if (response.accepted.includes(email))
//       // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
//       return successResponse(
//         res,
//         201,
//         "Successful Registration. Confirmation mail has been sent to email address.",
//         {
//           eventName: attendee.event.name,
//           description: attendee.event.description,
//           startDate: attendee.event.start_date,
//           attendeeCount: updatedEvent.attendees_count,
//           maxAttendees: attendee.event.max_attendees,
//           location: attendee.event.location,
//         }
//       );
//   } catch (error) {
//     // Handle error
//     // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
//     return errorResponse(res, 500, "Internal Error", { details: error });
//   }
// };

const hackers = {
  create,
  login,
  getHacker,
  getHackerCount,
  getLoggedInHacker,
  downloadHackers,
};
export default hackers;
