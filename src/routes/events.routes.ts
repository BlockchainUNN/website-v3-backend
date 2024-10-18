import Router from "express";
import events from "../controllers/events.controllers";

const eventsRoutes = Router.Router();

// Basic Events Routes
eventsRoutes.post("/events/registeration/:id", events.register);
eventsRoutes.post("/events/attendees/:id", events.getAttendee);
eventsRoutes.get("/events/attendees/count/:id", events.getAttendeeCount);

export default eventsRoutes;
