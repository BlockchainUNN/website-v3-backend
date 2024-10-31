import Router from "express";
import events from "../../controllers/admin/event.controllers";

const adminEventsRoutes = Router.Router();

// Basic Events Routes
adminEventsRoutes.get(
  "/admin/events/attendees/:id/download-csv",
  events.downloadAttendee
);

// Basic Events Routes
adminEventsRoutes.get("/admin/events/attendees/:id", events.getAttendees);

export default adminEventsRoutes;
