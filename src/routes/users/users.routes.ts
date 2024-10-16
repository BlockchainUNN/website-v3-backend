import { Router } from "express";
import usersControllers from "../../controllers/users/users.controllers";
import AuthMiddleware from "../../middlewares/auth.middleware";
import { permissionsCheck } from "../../middlewares/permissions.middleware";
import { upload } from "../../config/upload";

const userRoutes = Router();

userRoutes.post(
  "/users/",
  upload.single("profilePic"),
  usersControllers.create
);
userRoutes.get(
  "/users",
  AuthMiddleware.protectRoute,
  permissionsCheck({ role: "admin" }),
  usersControllers.getUsers
);
userRoutes.get("/users/:email", usersControllers.getUserDetails);

export default userRoutes;
