import { Request, Response } from "express";
import {
  cvsResponse,
  errorResponse,
  successResponse,
} from "../../utils/responseHandlers";
import prisma from "../../../prisma/client";

const downloadAttendee = async (req: Request, res: Response) => {
  // #swagger.tags = ['Events']
  // #swagger.summary = "Endpoint for downloading Attendees of a specific event"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
    const eventId = req.params?.id;

    // Get the event
    const event = await prisma.event.findUnique({ where: { uid: eventId } });
    if (!event) return errorResponse(res, 404, "Event not found");

    // Get event attendees
    const eventAttendees = await prisma.eventAttendee.findMany({
      where: { event_id: event.id },
      select: { registrationDetails: true },
    });

    const data = JSON.parse(
      JSON.stringify(
        eventAttendees.map((detail) => {
          return detail.registrationDetails;
        })
      )
    );

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return cvsResponse(res, 200, "eventAttendeeDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const getAttendees = async (req: Request, res: Response) => {
  // #swagger.tags = ['Events']
  // #swagger.summary = "Endpoint for Getting Attendees of a specific event"
  try {
    // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
    const eventId = req.params?.id;

    // Get the event
    const event = await prisma.event.findUnique({ where: { uid: eventId } });
    if (!event) return errorResponse(res, 404, "Event not found");

    // Get event attendees
    const eventAttendees = await prisma.eventAttendee.findMany({
      where: { event_id: event.id },
      select: { id: true, registrationDetails: true },
    });

    const data = JSON.parse(
      JSON.stringify(
        eventAttendees.map((detail) => {
          return detail.registrationDetails;
        })
      )
    );

    // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
    return successResponse(res, 200, "eventAttendeeDetails", data);
  } catch (error) {
    // Handle error
    console.log(error);

    // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
    return errorResponse(res, 500, "Internal Error", { details: error });
  }
};

const events = { downloadAttendee, getAttendees };
export default events;
