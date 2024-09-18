import { Router } from "express";
import eventsControllers from "../../controllers/events/events.controllers";


const getEventsRoutes = Router();

// Public route to get events
getEventsRoutes.get("/events", eventsControllers.getEvents);
getEventsRoutes.get("/events/:id", eventsControllers.getEventDetails)
export default getEventsRoutes;

