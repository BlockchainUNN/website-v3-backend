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


  const updateEvent = async (req: Request, res: Response) => {
    const { id } = req.params;
  
    try {
      const event = await prisma.event.findUnique({ where: { id: parseInt(id) } });
      if (!event) {
        return errorResponse(res, 404, "Event not found.");
      }
  
      // Get updated data from the request body
      const { name, description, start_date, end_date, location, max_attendees } = req.body;
  
      // Handle optional file upload (if cover_image is provided)
      const cover_image = req.file ? req.file.path : event.cover_image;
  
      // Update the event
      const updatedEvent = await prisma.event.update({
        where: { id: parseInt(id) },
        data: {
          name: name || event.name,
          description: description || event.description,
          start_date: start_date ? new Date(start_date) : event.start_date,
          end_date: end_date ? new Date(end_date) : event.end_date,
          location: location || event.location,
          max_attendees: max_attendees || event.max_attendees,
          cover_image,
        },
      });
  
      return successResponse(res, 200, "Event updated successfully.", updatedEvent);
    } catch (error) {
      return errorResponse(res, 500, "Failed to update event.", error);
    }
  }

export default {getEvents, getEventDetails, createEvent, updateEvent}