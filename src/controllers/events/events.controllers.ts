import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { successResponse, errorResponse } from "../../utils/responseHandlers";


const getEvents = async (req: Request, res: Response) => {
    try {
        const events = await prisma.event.findMany();

        return successResponse(
            res,
            200,
            "Events retrieved Successfully",
            events
        
        )
    } catch (error) {
        return errorResponse(
            res,
            500,
            "An error occurred while retrieving events",
            error
          );
        
    }
}


const getEventDetails = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      // Find event by id, include co-hosts in the response
      const event = await prisma.event.findUnique({
        where: { id: Number(id) },
        include: { cohosts: true }, // Assuming `cohosts` is a relation in your Prisma model
      });
  
      if (!event) {
        return errorResponse(res, 404, "Event not found");
      }
  
      return successResponse(
        res,
        200,
        "Event details retrieved successfully",
        event
      );
    } catch (error) {
      return errorResponse(
        res,
        500,
        "An error occurred while retrieving event details",
        error
      );
    }
  };
  

export default {getEvents, getEventDetails}