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
const responseHandlers_1 = require("../utils/responseHandlers");
const validationHandlers_1 = require("../utils/validationHandlers");
const client_1 = __importDefault(require("../../prisma/client"));
const mailHandler_1 = require("../utils/mailHandler");
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Events']
    // #swagger.summary = "Endpoint for registering for an event"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event User is regiatering for", required: 'true'}
        // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Takes email, and any other details you send in will be saved as well in a json field", schema: {email: "jondoe@example.com"}}
        const { email } = req.body;
        const eventId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Validate user data
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        // Checl if event exists
        const event = yield client_1.default.event.findUnique({ where: { uid: eventId } });
        if (!event)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        // Check if user with email exists
        const existingUser = yield client_1.default.user.findUnique({
            where: { email: email },
            include: { eventAttendee: true },
        });
        if (!existingUser) {
            // #swagger.responses[404] = {description: 'User/Event not found', schema: {message: 'Community member with this email does not exist.', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 404, "Community member with this email does not exist.");
        }
        // Check if user has registered for event already
        const eventsRegistered = existingUser.eventAttendee.map((eventAttendee) => {
            return eventAttendee.event_id;
        });
        if (eventsRegistered.includes(event.id))
            return (0, responseHandlers_1.errorResponse)(res, 400, "You are already registered for this event");
        // Register user as an attendee for the event
        const attendee = yield client_1.default.eventAttendee.create({
            data: {
                attendee_id: existingUser.id,
                event_id: event.id,
                registrationDetails: req.body,
            },
            include: { event: true, user: true },
        });
        // Update attendee count in event
        const updatedEvent = yield client_1.default.event.update({
            where: { uid: eventId },
            data: { attendees_count: event.attendees_count + 1 },
        });
        // Send mail
        const response = yield (0, mailHandler_1.sendMail)(email, `${attendee.user.first_name} You’re In!`, "event_registration", { firstName: attendee.user.first_name });
        if (response.rejected.includes(email))
            // #swagger.responses[403] = {description: 'Email rejected', schema: {message: 'Failed to deliver the email to the recipient. Please check the email address.', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 403, "Failed to deliver the email to the recipient. Please check the email address.");
        if (response.accepted.includes(email))
            // #swagger.responses[201] = {description: 'User successfully registered for event.', schema: {message: 'Successful Registration. Confirmation mail has been sent to email address.', data: {details: "If more info is available it will be here."}}}
            return (0, responseHandlers_1.successResponse)(res, 201, "Successful Registration. Confirmation mail has been sent to email address.", {
                eventName: attendee.event.name,
                description: attendee.event.description,
                startDate: attendee.event.start_date,
                attendeeCount: updatedEvent.attendees_count,
                maxAttendees: attendee.event.max_attendees,
                location: attendee.event.location,
            });
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Events']
    // #swagger.summary = "Endpoint for checking if someone is registered for a specific event"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        // #swagger.parameters['body'] = { in: 'body', required: 'true', description: "Users email address", schema: {email: "jondoe@example.com"}}
        const { email } = req.body;
        const eventId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Validate user data
        if (!email || !(0, validationHandlers_1.isValidEmailAddress)(email))
            // #swagger.responses[400] = {description: 'Bad request - Missing or invalid data', schema: {error: 'Invalid email address', details: "If more info is available it will be here."}}
            return (0, responseHandlers_1.errorResponse)(res, 400, "Invalid email address");
        // Get the event
        const event = yield client_1.default.event.findUnique({ where: { uid: eventId } });
        if (!event)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        // Get user
        const attendee = yield client_1.default.user.findUnique({ where: { email } });
        if (!attendee)
            return (0, responseHandlers_1.errorResponse)(res, 404, "User not found");
        // Get event attendee
        const eventAttendee = yield client_1.default.eventAttendee.findFirst({
            where: { attendee_id: attendee.id, event_id: event.id },
            include: { event: true, user: true },
        });
        if (!eventAttendee)
            return (0, responseHandlers_1.errorResponse)(res, 404, "User has not registerd for the event");
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "Event attendee successfully retrieved", Object.assign(Object.assign({}, eventAttendee), { event: {
                uid: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.event.uid,
                name: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.event.name,
                cover_image: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.event.cover_image,
                description: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.event.description,
            }, user: {
                uid: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.user.uid,
                first_name: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.user.first_name,
                last_name: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.user.last_name,
                email: eventAttendee === null || eventAttendee === void 0 ? void 0 : eventAttendee.user.email,
            } }));
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getAttendeeCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Events']
    // #swagger.summary = "Endpoint for checking if someone is registered for a specific event"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        const eventId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const attendeeCount = yield client_1.default.eventAttendee.count({
            where: { event: { uid: eventId } },
        });
        if (!attendeeCount)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "Successfully", { attendeeCount });
    }
    catch (error) {
        // Handle error
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const events = { register, getAttendee, getAttendeeCount };
exports.default = events;
