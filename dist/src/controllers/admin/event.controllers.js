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
const responseHandlers_1 = require("../../utils/responseHandlers");
const client_1 = __importDefault(require("../../../prisma/client"));
const downloadAttendee = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Events']
    // #swagger.summary = "Endpoint for downloading Attendees of a specific event"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        const eventId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const event = yield client_1.default.event.findUnique({ where: { uid: eventId } });
        if (!event)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        // Get event attendees
        const eventAttendees = yield client_1.default.eventAttendee.findMany({
            where: { event_id: event.id },
            select: { registrationDetails: true },
        });
        const data = JSON.parse(JSON.stringify(eventAttendees.map((detail) => {
            return detail.registrationDetails;
        })));
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.cvsResponse)(res, 200, "eventAttendeeDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const getAttendees = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // #swagger.tags = ['Events']
    // #swagger.summary = "Endpoint for Getting Attendees of a specific event"
    try {
        // #swagger.parameters['id'] = {description: "Id of the event we are checking", required: 'true'}
        const eventId = (_a = req.params) === null || _a === void 0 ? void 0 : _a.id;
        // Get the event
        const event = yield client_1.default.event.findUnique({ where: { uid: eventId } });
        if (!event)
            return (0, responseHandlers_1.errorResponse)(res, 404, "Event not found");
        // Get event attendees
        const eventAttendees = yield client_1.default.eventAttendee.findMany({
            where: { event_id: event.id },
            select: { id: true, registrationDetails: true },
        });
        const data = JSON.parse(JSON.stringify(eventAttendees.map((detail) => {
            return detail.registrationDetails;
        })));
        // #swagger.responses[200] = {description: 'User details retrieved succesfully', schema: {message: '', data: {details: "If more info is available it will be here."}}}
        return (0, responseHandlers_1.successResponse)(res, 200, "eventAttendeeDetails", data);
    }
    catch (error) {
        // Handle error
        console.log(error);
        // #swagger.responses[500] = {description: 'Internal server error', schema: {error: 'Internal server error', details: "If more info is available it will be here."}}
        return (0, responseHandlers_1.errorResponse)(res, 500, "Internal Error", { details: error });
    }
});
const events = { downloadAttendee, getAttendees };
exports.default = events;
