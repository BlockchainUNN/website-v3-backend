"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_controllers_1 = __importDefault(require("../../controllers/admin/event.controllers"));
const adminEventsRoutes = express_1.default.Router();
// Basic Events Routes
adminEventsRoutes.get("/admin/events/attendees/:id/download-csv", event_controllers_1.default.downloadAttendee);
// Basic Events Routes
adminEventsRoutes.get("/admin/events/attendees/:id", event_controllers_1.default.getAttendees);
exports.default = adminEventsRoutes;
