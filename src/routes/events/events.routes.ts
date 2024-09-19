import { Router } from "express";
import eventsControllers from "../../controllers/events/events.controllers";
import AuthMiddleware from "../../middlewares/auth.middleware";
import { permissionsCheck } from "../../middlewares/permissions.middleware";
import { upload } from "../../config/upload";


const getEventsRoutes = Router();

// Public route to get events
getEventsRoutes.get("/events", eventsControllers.getEvents);
getEventsRoutes.get("/events/:id", eventsControllers.getEventDetails)
getEventsRoutes.post(
    "/events",
    AuthMiddleware.protectRoute,
    permissionsCheck({ role: ["admin", "event_admin", "superadmin"] }),
    upload.single("cover_image"), // Multer middleware to handle single file upload
    eventsControllers.createEvent // Event creation controller
  );


export default getEventsRoutes;




