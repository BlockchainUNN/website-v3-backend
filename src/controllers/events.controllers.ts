import { Request, Response } from "express";
import { errorResponse, successResponse } from "../utils/responseHandlers";
import { isValidEmailAddress } from "../utils/validationHandlers";
import prisma from "../../prisma/client";
import { sendMail } from "../utils/mailHandler";

const register = async (req: Request, res: Response) => {
  // #swagger.tags = ['Events']
  // #swagger.summary = "Endpoint for registering for an event"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event User is regiatering for", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', schema: {email: "jondoe@example.com"}}
    const { email } = req.body;
    const eventId = req.params?.id;

    // Validate user data
    if (!email || !isValidEmailAddress(email))
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "Invalid email address");

    // Checl if event exists
    const event = await prisma.event.findUnique({ where: { uid: eventId } });
    if (!event) return errorResponse(res, 404, "Event not found");

    // Check if user with email exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
      include: { event: true },
    });

    if (!existingUser) {
      // #swagger.responses[404] = {description: 'User/Event not found', schema: {message: 'Community member with this email does not exist.', details: "If more info is available it will be here."}}
      return errorResponse(
        res,
        404,
        "Community member with this email does not exist."
      );
    }

    // Check if user has registered for event already
    const eventsRegistered = existingUser.event.map((event) => event.uid);
    if (eventsRegistered.includes(event.uid))
      return errorResponse(
        res,
        400,
        "User is already registered for this event"
      );

    // Register user as an attendee for the event
    const attendee = await prisma.eventAttendee.create({
      data: {
        attendee_id: existingUser.id,
        event_id: event.id,
      },
      include: { event: true },
    });

    // Update attendee count in event
    const updatedEvent = await prisma.event.update({
      where: { uid: eventId },
      data: { attendees_count: event.attendees_count + 1 },
    });

    // Send mail
    const response = await sendMail(
      email,
      `You have successfully registered for ${attendee.event.name}`,
      "event_registration",
      {}
    );
    if (response.rejected.includes(email))
      // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
      return errorResponse(
        res,
        403,
        "Failed to deliver the email to the recipient. Please check the email address."
      );

    if (response.accepted.includes(email))
      // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
      return successResponse(
        res,
        201,
        "Successful Registration. Confirmation mail has been sent to email address.",
        {
          eventName: attendee.event.name,
          description: attendee.event.description,
          startDate: attendee.event.start_date,
          attendeeCount: updatedEvent.attendees_count,
          maxAttendees: attendee.event.max_attendees,
          location: attendee.event.location,
        }
      );
  } catch (error) {
    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const events = { register };
export default events;
