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
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Takes email, and any other details you send in will be saved as well in a json field", schema: {email: "jondoe@example.com"}}
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
      include: { eventAttendee: true },
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
    const eventsRegistered = existingUser.eventAttendee.map((eventAttendee) => {
      return eventAttendee.event_id;
    });
    if (eventsRegistered.includes(event.id))
      return errorResponse(
        res,
        400,
        "You are already registered for this event"
      );

    // Register user as an attendee for the event
    const attendee = await prisma.eventAttendee.create({
      data: {
        attendee_id: existingUser.id,
        event_id: event.id,
        registrationDetails: req.body,
      },
      include: { event: true, user: true },
    });

    // Update attendee count in event
    const updatedEvent = await prisma.event.update({
      where: { uid: eventId },
      data: { attendees_count: event.attendees_count + 1 },
    });

    // Send mail
    const response = await sendMail(
      email,
      `${attendee.user.first_name} You’re In!`,
      "event_registration",
      { firstName: attendee.user.first_name }
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

const getAttendee = async (req: Request, res: Response) => {
  // #swagger.tags = ['Events']
  // #swagger.summary = "Endpoint for checking if someone is registered for a specific event"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
    // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Users email address", schema: {email: "jondoe@example.com"}}
    const { email } = req.body;
    const eventId = req.params?.id;

    // Validate user data
    if (!email || !isValidEmailAddress(email))
      // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
      return errorResponse(res, 400, "Invalid email address");

    // Get the event
    const event = await prisma.event.findUnique({ where: { uid: eventId } });
    if (!event) return errorResponse(res, 404, "Event not found");

    // Get user
    const attendee = await prisma.user.findUnique({ where: { email } });
    if (!attendee) return errorResponse(res, 404, "User not found");

    // Get event attendee
    const eventAttendee = await prisma.eventAttendee.findFirst({
      where: { attendee_id: attendee.id, event_id: event.id },
      include: { event: true, user: true },
    });
    if (!eventAttendee)
      return errorResponse(res, 404, "User has not registerd for the event");

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "Event attendee successfully retrieved", {
      ...eventAttendee,
      event: {
        uid: eventAttendee?.event.uid,
        name: eventAttendee?.event.name,
        cover_image: eventAttendee?.event.cover_image,
        description: eventAttendee?.event.description,
      },
      user: {
        uid: eventAttendee?.user.uid,
        first_name: eventAttendee?.user.first_name,
        last_name: eventAttendee?.user.last_name,
        email: eventAttendee?.user.email,
      },
    });
  } catch (error) {
    // Handle error
    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const events = { register, getAttendee };
export default events;
