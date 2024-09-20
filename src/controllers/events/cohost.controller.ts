import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { successResponse, errorResponse } from "../../utils/responseHandlers";

const cohostControllers = {
    createEventCohost: async (req: Request, res: Response) => {
        const { event_id, name, role_skill, x_url, linkedin_url, instagram_url, facebook_url, discord_url } = req.body;
    
        try {
          // Validate if the required fields are provided
          if (!event_id || !name || !role_skill) {
            return errorResponse(res, 400, "Event ID, Name, and Role Skill are required");
          }
    
          // Check if the event exists
          const event = await prisma.event.findUnique({
            where: { id: event_id },
          });
    
          if (!event) {
            return errorResponse(res, 404, "Event not found");
          }
    
          // Create a new cohost
          const newCohost = await prisma.eventCohost.create({
            data: {
              event_id,
              name,
              role_skill,
              x_url,
              linkedin_url,
              instagram_url,
              facebook_url,
              discord_url,
            },
          });
    
          // Return success response
          return successResponse(res, 201, "Event cohost created successfully", newCohost);
        } catch (error) {
          console.error("Error creating cohost: ", error);
          return errorResponse(res, 500, "Something went wrong while creating the cohost", error);
        }
      },
}

export default cohostControllers