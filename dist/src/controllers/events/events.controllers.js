"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = __importDefault(require("../../../prisma/client"));
const responseHandlers_1 = require("../../utils/responseHandlers");
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield client_1.default.event.findMany();
        return (0, responseHandlers_1.successResponse)(res, 200, "Events retrieved Successfully", events);
    }
    catch (error) {
        return (0, responseHandlers_1.errorResponse)(res, 500, "An error occurred while retrieving events", error);
    }
});
const getEventDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Find event by id, include co-hosts in the response
        const event = yield client_1.default.event.findUnique({
            where: { id: Number(id) },
            include: { cohosts: true }, // Assuming `cohosts` is a relation in your Prisma model
        });
        if (!event) {
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        }
        return (0, responseHandlers_1.successResponse)(res, 200, "Event details retrieved successfully", event);
    }
    catch (error) {
        return (0, responseHandlers_1.errorResponse)(res, 500, "An error occurred while retrieving event details", error);
    }
});
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, unique_name, description, start_date, end_date, location, host_id, max_attendees, } = req.body;
    try {
        // Validate required fields
        if (!name ||
            !unique_name ||
            !description ||
            !start_date ||
            !end_date ||
            !location ||
            !host_id ||
            !max_attendees) {
            return (0, responseHandlers_1.errorResponse)(res, 400, "All required fields must be provided");
        }
        // Check if a file was uploaded (assuming the image field is "cover_image")
        let coverImageUrl = null;
        if (req.file) {
            // Assuming the file is coming from a `multipart/form-data` request with the field `cover_image`
            const file = req.file;
            const uploadResult = yield (0, imageUploadHandler_1.uploadSingleImage)(file);
            coverImageUrl = uploadResult.url;
        }
        // Create the event in the database
        const event = yield client_1.default.event.create({
            data: {
                name,
                uid: unique_name,
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
        return (0, responseHandlers_1.successResponse)(res, 201, "Event created successfully", event);
    }
    catch (error) {
        console.error(error);
        return (0, responseHandlers_1.errorResponse)(res, 500, "An error occurred while creating the event", error);
    }
});
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    try {
        const event = yield client_1.default.event.findUnique({
            where: { id: parseInt(id) },
        });
        if (!event) {
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found.");
        }
        // Get updated data from the request body
        const { name, description, start_date, end_date, location, max_attendees } = req.body;
        // Handle optional file upload (if cover_image is provided)
        const cover_image = req.file ? req.file.path : event.cover_image;
        // Update the event
        const updatedEvent = yield client_1.default.event.update({
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
        return (0, responseHandlers_1.successResponse)(res, 200, "Event updated successfully.", updatedEvent);
    }
    catch (error) {
        return (0, responseHandlers_1.errorResponse)(res, 500, "Failed to update event.", error);
    }
});
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const eventId = parseInt(req.params.id); // Get the event ID from the request parameters
    try {
        // Find the event by ID
        const event = yield client_1.default.event.findUnique({
            where: { id: eventId },
        });
        // If event doesn't exist, return error
        if (!event) {
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        }
        // Delete the event
        yield client_1.default.event.delete({
            where: { id: eventId },
        });
        // Return a success response
        return (0, responseHandlers_1.successResponse)(res, 200, "Event deleted successfully");
    }
    catch (error) {
        console.error("Error deleting event: ", error);
        return (0, responseHandlers_1.errorResponse)(res, 500, "Something went wrong while deleting the event", error);
    }
});
exports.default = {
    getEvents,
    getEventDetails,
    createEvent,
    updateEvent,
    deleteEvent,
};
