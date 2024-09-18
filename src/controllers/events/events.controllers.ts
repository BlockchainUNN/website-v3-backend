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


export default {getEvents}