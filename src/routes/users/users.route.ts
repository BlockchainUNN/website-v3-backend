import { Router } from "express";
import usersControllers from "../../controllers/users/users.controllers";
import AuthMiddleware from "../../middlewares/auth.middleware";
import { permissionsCheck } from "../../middlewares/permissions.middleware";

const getUserRoutes = Router();

getUserRoutes.get(
  "/users",
  AuthMiddleware.protectRoute,
  permissionsCheck({ role: "admin" }),
  usersControllers.getUsers
);

export default getUserRoutes;
