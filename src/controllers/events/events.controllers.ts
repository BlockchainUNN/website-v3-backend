import { Request, Response } from "express";
import prisma from "../../../prisma/client";
import { successResponse, errorResponse } from "../../utils/responseHandlers";
import { FileType } from "../../types/files.types";
import { uploadSingleImage } from "../../utils/imageUploadHandler";


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
  
  const createEvent = async (req: Request, res: Response) => {
    const { name, description, start_date, end_date, location, host_id, max_attendees } = req.body;
  
    try {
      // Validate required fields
      if (!name || !description || !start_date || !end_date || !location || !host_id || !max_attendees) {
        return errorResponse(res, 400, "All required fields must be provided");
      }
  
      // Check if a file was uploaded (assuming the image field is "cover_image")
      let coverImageUrl = null;
      if (req.file) {
        // Assuming the file is coming from a `multipart/form-data` request with the field `cover_image`
        const file: FileType = req.file;
        const uploadResult = await uploadSingleImage(file);
        coverImageUrl = uploadResult.url;
      }
  
      // Create the event in the database
      const event = await prisma.event.create({
        data: {
          name,
          cover_image: coverImageUrl || "", // Save the uploaded image URL
          description,
          start_date: new Date(start_date),
          end_date: new Date(end_date),
          location,
          host_id: Number(host_id),
          max_attendees: Number(max_attendees),
          attendees_count: 0,
        },
      });
  
      return successResponse(res, 201, "Event created successfully", event);
    } catch (error) {
      console.error(error);
      return errorResponse(res, 500, "An error occurred while creating the event", error);
    }
  };

export default {getEvents, getEventDetails, createEvent}