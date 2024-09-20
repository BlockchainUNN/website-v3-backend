import { Router } from "express";
import AuthMiddleware from "../../middlewares/auth.middleware";
import { permissionsCheck } from "../../middlewares/permissions.middleware";
import cohostControllers from "../../controllers/events/cohost.controller";

const cohostRoutes = Router();

cohostRoutes.post(
    "/event/cohosts",
    AuthMiddleware.protectRoute, 
    permissionsCheck({ role: ["admin", "event_admin", "superadmin"] }), 
    cohostControllers.createEventCohost 
)


export default cohostRoutes