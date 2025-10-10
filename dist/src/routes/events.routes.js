"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const events_controllers_1 = __importDefault(require("../controllers/events.controllers"));
const eventsRoutes = express_1.default.Router();
// Basic Events Routes
eventsRoutes.post("/events/registeration/:id", events_controllers_1.default.register);
eventsRoutes.post("/events/attendees/:id", events_controllers_1.default.getAttendee);
eventsRoutes.get("/events/attendees/count/:id", events_controllers_1.default.getAttendeeCount);
exports.default = eventsRoutes;
