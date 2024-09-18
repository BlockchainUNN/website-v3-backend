import Router from "express";
import events from "../controllers/events.controllers";

const eventsRoutes = Router.Router();

// Basic Events Routes
eventsRoutes.post("/events/registeration/:id", events.register);

export default eventsRoutes;
