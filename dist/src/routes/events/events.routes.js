"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const events_controllers_1 = __importDefault(require("../../controllers/events/events.controllers"));
const auth_middleware_1 = __importDefault(require("../../middlewares/auth.middleware"));
const permissions_middleware_1 = require("../../middlewares/permissions.middleware");
const upload_1 = require("../../config/upload");
const getEventsRoutes = (0, express_1.Router)();
// Public route to get events
getEventsRoutes.get("/events", events_controllers_1.default.getEvents);
getEventsRoutes.get("/events/:id", events_controllers_1.default.getEventDetails);
getEventsRoutes.post("/events", auth_middleware_1.default.protectRoute, (0, permissions_middleware_1.permissionsCheck)({ role: ["admin", "event_admin", "superadmin"] }), upload_1.upload.single("cover_image"), events_controllers_1.default.createEvent // Event creation controller
);
getEventsRoutes.put("/events/:id", auth_middleware_1.default.protectRoute, // Ensure user is authenticated
(0, permissions_middleware_1.permissionsCheck)({ role: ["admin", "event_admin", "superadmin"] }), upload_1.upload.single("cover_image"), events_controllers_1.default.updateEvent);
getEventsRoutes.delete("/events/:id", auth_middleware_1.default.protectRoute, // Ensure the user is authenticated
(0, permissions_middleware_1.permissionsCheck)({ role: ["admin", "event_admin", "superadmin"] }), // Restrict access to admin or event_admin
events_controllers_1.default.deleteEvent // Controller to handle the deletion
);
exports.default = getEventsRoutes;
