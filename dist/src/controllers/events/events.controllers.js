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
exports.unregisterFromEvent = exports.registerForEvent = exports.deleteEvent = exports.updateEvent = exports.createEvent = exports.getEventById = exports.getEvents = void 0;
const response_1 = require("../../lib/response");
const response_2 = require("../../lib/response");
const imageUploadHandler_1 = require("../../utils/imageUploadHandler");
const api_types_1 = require("../../types/api.types");
const permissions_1 = require("../../lib/permissions");
const client_1 = __importDefault(require("../../../prisma/client"));
const error_1 = require("../../lib/error");
const errorHandler_1 = require("../../middlewares/errorHandler");
const mailHandler_1 = require("../../utils/mailHandler");
/**
 * Get all events with pagination and filtering
 * @route GET /api/v3/events
 * @access Public
 */
exports.getEvents = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const query = req.query;
    const { page = 1, limit = 10, search, upcoming, past, sortBy = "start_date", sortOrder = "asc", } = query;
    // Build where clause for filtering
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
        ];
    }
    // Date filtering
    const now = new Date();
    if (upcoming === true) {
        where.start_date = { gte: now };
    }
    else if (past === true) {
        where.end_date = { lt: now };
    }
    // Get total count for pagination
    const total = yield client_1.default.event.count({ where });
    // Get events with pagination
    const events = yield client_1.default.event.findMany({
        where,
        include: {
            host: true,
            cohosts: true,
            eventAttendee: {
                select: {
                    id: true,
                },
            },
            _count: {
                select: {
                    eventAttendee: true,
                },
            },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
    });
    // Transform events for response
    const transformedEvents = events.map((event) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const eventHost = yield client_1.default.user.findUnique({
            where: { id: event.host_id },
            include: { roles: true },
        });
        const cohost = yield client_1.default.user.findUnique({
            where: { id: event.host_id },
            include: { roles: true },
        });
        return {
            id: event.id,
            uid: event.uid,
            name: event.name,
            description: event.description,
            coverImage: event.cover_image,
            startDate: event.start_date.toISOString(),
            endDate: event.end_date.toISOString(),
            location: event.location,
            maxAttendees: event.max_attendees,
            attendeesCount: event.attendees_count,
            availableSlots: event.max_attendees - event.attendees_count,
            host: {
                id: eventHost === null || eventHost === void 0 ? void 0 : eventHost.id,
                uid: eventHost === null || eventHost === void 0 ? void 0 : eventHost.uid,
                firstName: eventHost === null || eventHost === void 0 ? void 0 : eventHost.first_name,
                lastName: eventHost === null || eventHost === void 0 ? void 0 : eventHost.last_name,
                email: eventHost === null || eventHost === void 0 ? void 0 : eventHost.email,
                role: ((_a = eventHost === null || eventHost === void 0 ? void 0 : eventHost.roles) === null || _a === void 0 ? void 0 : _a.role) || "user",
            },
            createdAt: event.created_at,
            updatedAt: event.updated_at,
            // Add status based on dates
            status: now < new Date(event.start_date)
                ? "upcoming"
                : now >= new Date(event.start_date) && now <= new Date(event.end_date)
                    ? "ongoing"
                    : "past",
            isRegistrationOpen: now < new Date(event.start_date) &&
                event.attendees_count < event.max_attendees,
        };
    }));
    const pagination = (0, response_2.calculatePagination)({ total, page, limit });
    return (0, response_1.paginatedResponse)(res, transformedEvents, pagination);
}));
/**
 * Get event by ID
 * @route GET /api/v3/events/:id
 * @access Public
 */
exports.getEventById = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
        throw error_1.AppError.badRequest("Invalid event ID");
    }
    const event = yield client_1.default.event.findUnique({
        where: { id: eventId },
        include: {
            host: {
                select: {
                    id: true,
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    roles: true,
                },
            },
            cohosts: true,
            eventAttendee: {
                include: {
                    user: {
                        select: {
                            id: true,
                            uid: true,
                            first_name: true,
                            last_name: true,
                            email: true,
                        },
                    },
                },
            },
            eventGallery: {
                include: {
                    image: {
                        select: {
                            id: true,
                            name: true,
                            image_url: true,
                        },
                    },
                },
            },
            _count: {
                select: {
                    eventAttendee: true,
                },
            },
        },
    });
    if (!event) {
        throw error_1.AppError.eventNotFound(eventId);
    }
    const now = new Date();
    // Check if user is registered (if authenticated)
    let isUserRegistered = false;
    if (req.user) {
        const registration = event.eventAttendee.find((attendee) => attendee.user.id === req.user.id);
        isUserRegistered = !!registration;
    }
    const transformedEvent = {
        id: event.id,
        uid: event.uid,
        name: event.name,
        description: event.description,
        coverImage: event.cover_image,
        startDate: event.start_date,
        endDate: event.end_date,
        location: event.location,
        maxAttendees: event.max_attendees,
        attendeesCount: event._count.eventAttendee,
        availableSlots: event.max_attendees - event._count.eventAttendee,
        host: {
            id: event.host.id,
            uid: event.host.uid,
            firstName: event.host.first_name,
            lastName: event.host.last_name,
            email: event.host.email,
            role: ((_a = event.host.roles) === null || _a === void 0 ? void 0 : _a.role) || "user",
        },
        cohosts: event.cohosts.map((cohost) => ({
            id: cohost.id,
            name: cohost.name,
            roleSkill: cohost.role_skill,
            xUrl: cohost.x_url,
            linkedinUrl: cohost.linkedin_url,
            instagramUrl: cohost.instagram_url,
            facebookUrl: cohost.facebook_url,
            discordUrl: cohost.discord_url,
        })),
        attendees: event.eventAttendee.map((attendee) => ({
            id: attendee.user.id,
            uid: attendee.user.uid,
            firstName: attendee.user.first_name,
            lastName: attendee.user.last_name,
            registrationDetails: attendee.registrationDetails,
            registeredAt: attendee.id, // Using attendee record creation as registration time
        })),
        gallery: event.eventGallery.map((gallery) => ({
            id: gallery.image.id,
            name: gallery.image.name,
            url: gallery.image.image_url,
        })),
        createdAt: event.created_at,
        updatedAt: event.updated_at,
        status: now < event.start_date
            ? "upcoming"
            : now >= event.start_date && now <= new Date(event.end_date)
                ? "ongoing"
                : "past",
        isRegistrationOpen: now < event.start_date &&
            event._count.eventAttendee < event.max_attendees,
        isUserRegistered,
    };
    return (0, response_1.successResponse)(res, transformedEvent);
}));
/**
 * Create new event
 * @route POST /api/v3/events
 * @access Event Admin, Admin, Superadmin
 */
exports.createEvent = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const eventData = req.body;
    const coverImage = req.file;
    if (!coverImage) {
        throw error_1.AppError.badRequest("Cover image is required");
    }
    // Validate dates
    const startDate = new Date(eventData.startDate);
    const endDate = new Date(eventData.endDate);
    const now = new Date();
    if (startDate <= now) {
        throw error_1.AppError.badRequest("Event start date must be in the future");
    }
    if (endDate <= startDate) {
        throw error_1.AppError.badRequest("Event end date must be after start date");
    }
    // Handle cover image upload
    let uploadedImage;
    try {
        uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(coverImage);
    }
    catch (error) {
        throw error_1.AppError.fileUploadError("Failed to upload cover image", error);
    }
    // Create event in a transaction
    const newEvent = yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Create the event
        const event = yield tx.event.create({
            data: {
                uid: `event_${Date.now()}`, // Simple UID generation
                name: eventData.name,
                description: eventData.description,
                cover_image: uploadedImage.url,
                start_date: startDate,
                end_date: endDate,
                location: eventData.location,
                host_id: req.user.id,
                attendees_count: 0,
                max_attendees: eventData.maxAttendees,
            },
        });
        // Create cohosts if provided
        if (eventData.cohosts && eventData.cohosts.length > 0) {
            yield tx.eventCohost.createMany({
                data: eventData.cohosts.map((cohost) => ({
                    event_id: event.id,
                    name: cohost.name,
                    role_skill: cohost.roleSkill,
                    x_url: cohost.xUrl || null,
                    linkedin_url: cohost.linkedinUrl || null,
                    instagram_url: cohost.instagramUrl || null,
                    facebook_url: cohost.facebookUrl || null,
                    discord_url: cohost.discordUrl || null,
                })),
            });
        }
        return event;
    }));
    // Fetch the complete event data
    const eventWithDetails = yield client_1.default.event.findUnique({
        where: { id: newEvent.id },
        include: {
            host: {
                select: {
                    id: true,
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    roles: true,
                },
            },
            cohosts: true,
        },
    });
    const responseData = {
        id: eventWithDetails.id,
        uid: eventWithDetails.uid,
        name: eventWithDetails.name,
        description: eventWithDetails.description,
        coverImage: eventWithDetails.cover_image,
        startDate: eventWithDetails.start_date,
        endDate: eventWithDetails.end_date,
        location: eventWithDetails.location,
        maxAttendees: eventWithDetails.max_attendees,
        attendeesCount: 0,
        host: {
            id: eventWithDetails.host.id,
            uid: eventWithDetails.host.uid,
            firstName: eventWithDetails.host.first_name,
            lastName: eventWithDetails.host.last_name,
            email: eventWithDetails.host.email,
            role: ((_a = eventWithDetails.host.roles) === null || _a === void 0 ? void 0 : _a.role) || "user",
        },
        cohosts: eventWithDetails.cohosts.map((cohost) => ({
            id: cohost.id,
            name: cohost.name,
            roleSkill: cohost.role_skill,
            xUrl: cohost.x_url,
            linkedinUrl: cohost.linkedin_url,
            instagramUrl: cohost.instagram_url,
            facebookUrl: cohost.facebook_url,
            discordUrl: cohost.discord_url,
        })),
        createdAt: eventWithDetails.created_at,
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/events/${newEvent.id}`, "Event created successfully");
}));
/**
 * Update event
 * @route PUT /api/v3/events/:id
 * @access Event Host, Admin, Superadmin
 */
exports.updateEvent = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id } = req.params;
    const eventId = parseInt(id);
    const updateData = req.body;
    const coverImage = req.file;
    if (isNaN(eventId)) {
        throw error_1.AppError.badRequest("Invalid event ID");
    }
    // Check if event exists
    const existingEvent = yield client_1.default.event.findUnique({
        where: { id: eventId },
        include: { host: true },
    });
    if (!existingEvent) {
        throw error_1.AppError.eventNotFound(eventId);
    }
    // Check permissions (host or admin)
    const canUpdate = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === existingEvent.host_id ||
        (0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.UPDATE_EVENT);
    if (!canUpdate) {
        throw error_1.AppError.forbidden("Cannot update this event");
    }
    // Validate dates if provided
    if (updateData.startDate || updateData.endDate) {
        const startDate = updateData.startDate
            ? new Date(updateData.startDate)
            : existingEvent.start_date;
        const endDate = updateData.endDate
            ? new Date(updateData.endDate)
            : existingEvent.end_date;
        if (endDate <= startDate) {
            throw error_1.AppError.badRequest("Event end date must be after start date");
        }
    }
    // Handle cover image upload
    let uploadedImageUrl = existingEvent.cover_image;
    if (coverImage) {
        try {
            const uploadedImage = yield (0, imageUploadHandler_1.uploadSingleImage)(coverImage);
            uploadedImageUrl = uploadedImage.url;
        }
        catch (error) {
            throw error_1.AppError.fileUploadError("Failed to upload cover image", error);
        }
    }
    // Update event in a transaction
    const updatedEvent = yield client_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Update the event
        const event = yield tx.event.update({
            where: { id: eventId },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (updateData.name && { name: updateData.name })), (updateData.description && {
                description: updateData.description,
            })), (uploadedImageUrl !== existingEvent.cover_image && {
                cover_image: uploadedImageUrl,
            })), (updateData.startDate && {
                start_date: new Date(updateData.startDate),
            })), (updateData.endDate && { end_date: new Date(updateData.endDate) })), (updateData.location && { location: updateData.location })), (updateData.maxAttendees && {
                max_attendees: updateData.maxAttendees,
            })),
        });
        // Update cohosts if provided
        if (updateData.cohosts) {
            // Delete existing cohosts
            yield tx.eventCohost.deleteMany({
                where: { event_id: eventId },
            });
            // Create new cohosts
            if (updateData.cohosts.length > 0) {
                yield tx.eventCohost.createMany({
                    data: updateData.cohosts.map((cohost) => ({
                        event_id: eventId,
                        name: cohost.name,
                        role_skill: cohost.roleSkill,
                        x_url: cohost.xUrl || null,
                        linkedin_url: cohost.linkedinUrl || null,
                        instagram_url: cohost.instagramUrl || null,
                        facebook_url: cohost.facebookUrl || null,
                        discord_url: cohost.discordUrl || null,
                    })),
                });
            }
        }
        return event;
    }));
    // Fetch the complete updated event data
    const eventWithDetails = yield client_1.default.event.findUnique({
        where: { id: eventId },
        include: {
            host: {
                select: {
                    id: true,
                    uid: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    roles: true,
                },
            },
            cohosts: true,
            _count: {
                select: {
                    eventAttendee: true,
                },
            },
        },
    });
    const responseData = {
        id: eventWithDetails.id,
        uid: eventWithDetails.uid,
        name: eventWithDetails.name,
        description: eventWithDetails.description,
        coverImage: eventWithDetails.cover_image,
        startDate: eventWithDetails.start_date,
        endDate: eventWithDetails.end_date,
        location: eventWithDetails.location,
        maxAttendees: eventWithDetails.max_attendees,
        attendeesCount: eventWithDetails._count.eventAttendee,
        host: {
            id: eventWithDetails.host.id,
            uid: eventWithDetails.host.uid,
            firstName: eventWithDetails.host.first_name,
            lastName: eventWithDetails.host.last_name,
            email: eventWithDetails.host.email,
            role: ((_b = eventWithDetails.host.roles) === null || _b === void 0 ? void 0 : _b.role) || "user",
        },
        cohosts: eventWithDetails.cohosts.map((cohost) => ({
            id: cohost.id,
            name: cohost.name,
            roleSkill: cohost.role_skill,
            xUrl: cohost.x_url,
            linkedinUrl: cohost.linkedin_url,
            instagramUrl: cohost.instagram_url,
            facebookUrl: cohost.facebook_url,
            discordUrl: cohost.discord_url,
        })),
        updatedAt: eventWithDetails.updated_at,
    };
    return (0, response_1.successResponse)(res, responseData, 200, "Event updated successfully");
}));
/**
 * Delete event
 * @route DELETE /api/v3/events/:id
 * @access Event Host, Admin, Superadmin
 */
exports.deleteEvent = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
        throw error_1.AppError.badRequest("Invalid event ID");
    }
    const event = yield client_1.default.event.findUnique({
        where: { id: eventId },
        include: { host: true },
    });
    if (!event) {
        throw error_1.AppError.eventNotFound(eventId);
    }
    // Check permissions (host or admin)
    const canDelete = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === event.host_id ||
        (0, permissions_1.hasPermission)(req.user.role, api_types_1.Permission.DELETE_EVENT);
    if (!canDelete) {
        throw error_1.AppError.forbidden("Cannot delete this event");
    }
    // Check if event has attendees
    const attendeeCount = yield client_1.default.eventAttendee.count({
        where: { event_id: eventId },
    });
    if (attendeeCount > 0) {
        throw error_1.AppError.badRequest("Cannot delete event with registered attendees");
    }
    // Delete event (cascade will handle related records)
    yield client_1.default.event.delete({
        where: { id: eventId },
    });
    return (0, response_1.successResponse)(res, { id: eventId }, 200, "Event deleted successfully");
}));
/**
 * Register for event
 * @route POST /api/v3/events/:id/register
 * @access Authenticated users
 */
exports.registerForEvent = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const eventId = parseInt(id);
    const { registrationDetails } = req.body;
    if (isNaN(eventId)) {
        throw error_1.AppError.badRequest("Invalid event ID");
    }
    const event = yield client_1.default.event.findUnique({
        where: { id: eventId },
        include: {
            _count: {
                select: {
                    eventAttendee: true,
                },
            },
        },
    });
    if (!event) {
        throw error_1.AppError.eventNotFound(eventId);
    }
    // Check if registration is open
    const now = new Date();
    if (now >= event.start_date) {
        throw error_1.AppError.registrationClosed();
    }
    // Check if event is full
    if (event.max_attendees > 0 &&
        event._count.eventAttendee >= event.max_attendees) {
        throw error_1.AppError.eventFull();
    }
    // Get or create user
    let user = yield client_1.default.user.findFirst({
        where: { email: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.email },
    });
    if (!user) {
        user = yield client_1.default.user.create({
            data: {
                first_name: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.firstName,
                last_name: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.lastName,
                email: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.email,
                gender: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.gender,
                phone_number: registrationDetails === null || registrationDetails === void 0 ? void 0 : registrationDetails.phoneNumber,
            },
        });
    }
    if (!user) {
        throw error_1.AppError.userNotFound("Could not find or create an account for this user");
    }
    // Check if user is already registered
    const existingRegistration = yield client_1.default.eventAttendee.findFirst({
        where: {
            event_id: eventId,
            attendee_id: user.id,
        },
    });
    if (existingRegistration) {
        throw error_1.AppError.conflict("You are already registered for this event");
    }
    // Create registration
    const registration = yield client_1.default.eventAttendee.create({
        data: {
            event_id: eventId,
            attendee_id: user.id,
            registrationDetails: registrationDetails !== null && registrationDetails !== void 0 ? registrationDetails : undefined,
        },
    });
    // Update attendee count
    yield client_1.default.event.update({
        where: { id: eventId },
        data: {
            attendees_count: {
                increment: 1,
            },
        },
    });
    // Send welcome email
    try {
        yield (0, mailHandler_1.sendMail)(user.email, `${user.first_name}, Welcome to Blockathon!!!`, "event_registeration", { firstName: user.first_name });
    }
    catch (emailError) {
        console.warn("Failed to send welcome email:", emailError);
        // Don't fail the registration if email fails
    }
    const responseData = {
        id: registration.id,
        eventId: eventId,
        userId: user.id,
        registrationDetails: registration.registrationDetails,
        registeredAt: registration.id, // Using registration record creation
    };
    return (0, response_1.createdResponse)(res, responseData, `/api/v3/events/${eventId}`, "Successfully registered for event");
}));
/**
 * Unregister from event
 * @route DELETE /api/v3/events/:id/register
 * @access Authenticated users
 */
exports.unregisterFromEvent = (0, errorHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const eventId = parseInt(id);
    if (isNaN(eventId)) {
        throw error_1.AppError.badRequest("Invalid event ID");
    }
    const event = yield client_1.default.event.findUnique({
        where: { id: eventId },
    });
    if (!event) {
        throw error_1.AppError.eventNotFound(eventId);
    }
    // Check if user is registered
    const registration = yield client_1.default.eventAttendee.findFirst({
        where: {
            event_id: eventId,
            attendee_id: req.user.id,
        },
    });
    if (!registration) {
        throw error_1.AppError.notFound("You are not registered for this event");
    }
    // Check if unregistration is allowed (e.g., not too close to event start)
    const now = new Date();
    const hoursBeforeEvent = (event.start_date.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursBeforeEvent < 24) {
        throw error_1.AppError.badRequest("Cannot unregister less than 24 hours before event start");
    }
    // Delete registration
    yield client_1.default.eventAttendee.delete({
        where: { id: registration.id },
    });
    // Update attendee count
    yield client_1.default.event.update({
        where: { id: eventId },
        data: {
            attendees_count: {
                decrement: 1,
            },
        },
    });
    return (0, response_1.noContentResponse)(res);
}));
exports.default = {
    getEvents: exports.getEvents,
    getEventById: exports.getEventById,
    createEvent: exports.createEvent,
    updateEvent: exports.updateEvent,
    deleteEvent: exports.deleteEvent,
    registerForEvent: exports.registerForEvent,
    unregisterFromEvent: exports.unregisterFromEvent,
};
