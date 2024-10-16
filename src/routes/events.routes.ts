import Router from "express";
import events from "../controllers/events.controllers";

const eventsRoutes = Router.Router();

// Basic Events Routes
eventsRoutes.post("/events/registeration/:id", events.register);
eventsRoutes.post("/events/attendees/:id", events.getAttendee);

export default eventsRoutes;
